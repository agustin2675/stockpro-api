import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreatePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Estado } from 'generated/prisma';
import PDFDocument from 'pdfkit'
import * as fs from 'fs/promises';
import * as path from 'path'

@Injectable()
export class PedidosService {
  

  constructor(private prismaService:PrismaService){

  }
  async create(createPedidoDto: CreatePedidoDto) {
    const {sucursal_id, dateTime, detalles} = createPedidoDto 
     // 1. Traer sucursalInsumos de los insumos que vienen en detalles
    const insumos = await this.prismaService.sucursalInsumo.findMany({
      where: {
        insumo_id: { in: detalles.map(d => d.insumo_id) },
        sucursal_id: sucursal_id
      },
      include: { insumo: true, tipoStock: true }
    });

    // 2. Mapear cada detalle aplicando la lógica
    const detallePedidosData = detalles.map(detalle => {
    const sucInsumo = insumos.find(i => i.insumo_id === detalle.insumo_id);

    if (!sucInsumo) {
      throw new Error(`No existe sucursalInsumo para insumo ${detalle.insumo_id}`);
    }
    const cantidadPedido = detalle.cantidadPedido > sucInsumo.cantidadMinima ? detalle.cantidadPedido : 0;

    return {
      cantidadPedido,
      cantidadReal: sucInsumo.cantidadReal,
      insumo: { connect: { id: detalle.insumo_id } },
      tipoStock: { connect: { id: detalle.tipoStock_id } }
    };
  });

  // 3. Crear el pedido con sus detalles ya calculados
  return this.prismaService.pedido.create({
    data: {
      sucursal_id,
      fecha: dateTime,
      estado: 'BORRADOR',
      detallePedidos: {
        create: detallePedidosData
      }
    }
  });
  }

  findAll() {
    return this.prismaService.pedido.findMany({
      include:{
        sucursal:true,
      }
    });
  }

  findOne(id: number) {
    return this.prismaService.pedido.findUnique({
      where: {
        id: id
      },
       include:{
        sucursal:true,
        detallePedidos: {
          include:{
            insumo: {
              select:{
                nombre: true
              }
            }
          }
        }
      }
    });
  }

  update(id: number, updatePedidoDto: UpdatePedidoDto) {
    const {sucursal_id, dateTime, detalles} = updatePedidoDto
    const insumosEntrantes = Array.from(new Set(detalles?.map(d => d.insumo_id)));
    if(detalles){
      
    return this.prismaService.$transaction(async (tx) => {
    const existe = await tx.pedido.findUnique({ where: { id }, select: { id: true } });
    if (!existe) throw new NotFoundException('Pedido no encontrado');

    // 1) borrar detalles que ya no vienen
    await tx.detallePedido.deleteMany({
      where: {
        pedido_id: id,
        NOT: { insumo_id: { in: insumosEntrantes.length ? insumosEntrantes : [-1] } },
      },
    });

    // 2) upsert de cada insumo entrante
    for (const d of detalles) {
      await tx.detallePedido.upsert({
        where: { pedido_id_insumo_id_tipoStock_id: { pedido_id: id, insumo_id: d.insumo_id, tipoStock_id: d.tipoStock_id } },
        create: { pedido_id: id, insumo_id: d.insumo_id, tipoStock_id: d.tipoStock_id, cantidadPedido: d.cantidadPedido, cantidadReal: d.cantidadReal },
        update: { cantidadPedido: d.cantidadPedido, cantidadReal: d.cantidadReal },
      });
    }

    // 3) devolver actualizado
    return tx.pedido.findUnique({
      where: { id },
      include: {
        detallePedidos: { include: { insumo: true } },
        sucursal: true,
      },
    });
  });
    }
  }

  async remove(id: number) {
    return await this.prismaService.pedido.delete({ where: { id } });
  }

async generateStockPdfById(pedidoId: number): Promise<Buffer> {
  const pedido = await this.prismaService.pedido.findUnique({
    where: { id: pedidoId },
    include: {
      sucursal: true,
      detallePedidos: {
        include: {
          insumo: { include: { unidadDeMedida: true, rubro: true } },
          tipoStock: true,
        },
        orderBy: [{ tipoStock_id: 'asc' }, { id: 'asc' }],
      },
    },
  })
  if (!pedido) throw new NotFoundException('Pedido no encontrado')

  const fmtYMD = (d: Date) => {
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  type Row = { nombre: string; unidad: string; real: number }
  type Section = { titulo: string; subTitulo: string; filas: Row[] }

  // ---- Agrupar por tipoStock -> rubro
  const byTipo: Record<string, Section[]> = {}
  for (const det of pedido.detallePedidos) {
    const tipo = det.tipoStock?.nombre ?? 'Sin tipo'
    const rubro = det.insumo?.rubro?.nombre ?? 'Sin rubro'
    const unidad = det.insumo?.unidadDeMedida?.nombre ?? ''
    const fila: Row = {
      nombre: det.insumo?.nombre ?? '',
      unidad: unidad || '—',
      real: det.cantidadReal ?? 0,
    }
    if (!byTipo[tipo]) byTipo[tipo] = []
    let sec = byTipo[tipo].find((s) => s.subTitulo === rubro)
    if (!sec) {
      sec = { titulo: tipo, subTitulo: rubro, filas: [] }
      byTipo[tipo].push(sec)
    }
    sec.filas.push(fila)
  }

  // Ordenar tipos (Extra al final) y rubros
  const tipoKeys = Object.keys(byTipo).sort((a, b) => {
    if (a.toLowerCase() === 'extra') return 1
    if (b.toLowerCase() === 'extra') return -1
    return a.localeCompare(b)
  })
  tipoKeys.forEach((k) => byTipo[k].sort((a, b) => a.subTitulo.localeCompare(b.subTitulo)))
  const sections: Section[] = tipoKeys.flatMap((k) => byTipo[k])

  // ---- Helpers de dibujo
  const drawRoundedRect = (
    doc: PDFKit.PDFDocument,
    x: number, y: number, w: number, h: number, r = 8,
    opt?: { fill?: string; stroke?: string }
  ) => {
    doc.save().roundedRect(x, y, w, h, r).lineWidth(1)
    if (opt?.fill) doc.fillColor(opt.fill).fill()
    if (opt?.stroke) doc.strokeColor(opt.stroke).stroke()
    doc.restore()
  }

  const drawSectionHeader = (doc: PDFKit.PDFDocument, x: number, y: number, w: number, label: string) => {
    drawRoundedRect(doc, x, y, w, 28, 8, { fill: '#EFE6D6' })
    doc.fillColor('#2C2C2C').font('Helvetica-Bold').fontSize(12)
      .text(label, x + 14, y + 8, { width: w - 28, align: 'left' })
  }

  const drawSubTitle = (doc: PDFKit.PDFDocument, x: number, y: number, text: string) => {
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#222').text(text, x, y)
  }

  const drawTable = (doc: PDFKit.PDFDocument, x: number, y: number, w: number, rows: Row[]) => {
    const colNombreW = Math.floor(w * 0.62)
    const colUnidadW = Math.floor(w * 0.20)
    const colRealW = w - colNombreW - colUnidadW
    const rowH = 26, headerH = 26
    const border = '#E6E6E6', headerBg = '#F7F7F7'

    drawRoundedRect(doc, x, y, w, headerH, 6, { fill: headerBg })
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#5A5A5A')
      .text('Nombre', x + 10, y + 8, { width: colNombreW - 12 })
      .text('Unidad', x + colNombreW + 10, y + 8, { width: colUnidadW - 12 })
      .text('Real', x + colNombreW + colUnidadW + 10, y + 8, { width: colRealW - 12 })

    doc.strokeColor(border)
      .moveTo(x + colNombreW, y).lineTo(x + colNombreW, y + headerH + rows.length * rowH).stroke()
      .moveTo(x + colNombreW + colUnidadW, y).lineTo(x + colNombreW + colUnidadW, y + headerH + rows.length * rowH).stroke()

    doc.font('Helvetica').fontSize(11).fillColor('#222')
    rows.forEach((r, i) => {
      const yRow = y + headerH + i * rowH
      doc.strokeColor(border).moveTo(x, yRow + rowH).lineTo(x + w, yRow + rowH).stroke()
      doc.text(r.nombre, x + 10, yRow + 7, { width: colNombreW - 12 })
      doc.text(r.unidad, x + colNombreW + 10, yRow + 7, { width: colUnidadW - 12 })
      doc.font('Helvetica-Bold').text(String(r.real), x + colNombreW + colUnidadW + 10, yRow + 7, { width: colRealW - 12 })
      doc.font('Helvetica')
    })

    return headerH + rows.length * rowH
  }

  // ---- Generación del PDF
  const buffer: Buffer = await new Promise((resolve) => {
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 56, bottom: 56, left: 56, right: 56 },
      bufferPages: true,
    })

    const usableW = doc.page.width - doc.page.margins.left - doc.page.margins.right
    const boxX = doc.page.margins.left
    const boxW = usableW

    // Título + subinfo
    const titulo = `Stock ${pedido.id}`
    const sucursalNombre = pedido.sucursal?.nombre ?? `Sucursal #${pedido.sucursal_id}`
    const fecha = fmtYMD(new Date(pedido.fecha))

    doc.font('Helvetica-Bold').fontSize(20).fillColor('#1F2937').text(titulo, { align: 'left' })
    doc.moveDown(0.2)
    doc.font('Helvetica').fontSize(11).fillColor('#374151')
      .text(`Sucursal: ${sucursalNombre}    Fecha: ${fecha}`, { align: 'left' })

    // >>> FIX: arrancar usando la posición real del cursor
    let boxY = doc.y + 12

    sections.forEach((sec, idx) => {
      const topY = boxY
      drawSectionHeader(doc, boxX, topY, boxW, sec.titulo)

      const innerX = boxX + 10
      let innerY = topY + 40
      const innerW = boxW - 20

      drawSubTitle(doc, innerX, innerY, sec.subTitulo)
      innerY += 18

      const tableHeight = drawTable(doc, innerX, innerY, innerW, sec.filas)
      innerY += tableHeight + 12

      const sectionH = innerY - topY + 8
      drawRoundedRect(doc, boxX, topY, boxW, sectionH, 10, { stroke: '#E5E0D6' })

      boxY = topY + sectionH + 16

      // Salto de página con padding inicial
      if (boxY > doc.page.height - doc.page.margins.bottom - 140 && idx < sections.length - 1) {
        doc.addPage()
        boxY = doc.page.margins.top + 12
      }
    })

    doc.end()
    const chunks: Buffer[] = []
    doc.on('data', (c: Buffer) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
  })

  return buffer
}

async generatePedidoPdfById(pedidoId: number): Promise<Buffer> {
    // 1) Traer datos completos
    const pedido = await this.prismaService.pedido.findUnique({
      where: { id: pedidoId },
      include: {
        sucursal: true,
        detallePedidos: {
          include: {
            insumo: {
              include: {
                unidadDeMedida: true,
                rubro: true,
              },
            },
            tipoStock: true,
          },
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!pedido) {
      throw new Error(`Pedido ${pedidoId} no encontrado`);
    }

    // 2) Agrupar: TipoStock -> Rubro -> Detalles
    type Item = (typeof pedido.detallePedidos)[number];
    const grouped: Record<
      string,
      Record<string, Item[]>
    > = {}; // { [tipoStock]: { [rubro]: Item[] } }

    for (const det of pedido.detallePedidos) {
      const tipo = det.tipoStock?.nombre ?? 'Sin tipo';
      const rubro = det.insumo?.rubro?.nombre ?? 'Sin rubro';
      if (!grouped[tipo]) grouped[tipo] = {};
      if (!grouped[tipo][rubro]) grouped[tipo][rubro] = [];
      grouped[tipo][rubro].push(det);
    }

    // 3) Crear PDF en memoria
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 56, left: 46, right: 46, bottom: 56 },
      bufferPages: true,
    });

    const chunks: Buffer[] = [];
    const stream = doc.on('data', (c: Buffer) => chunks.push(c));

    // --- Helpers de layout ---
    const pageWidth = doc.page.width;
    const contentWidth = pageWidth - doc.page.margins.left - doc.page.margins.right;

    const drawHr = (yOffset = 8) => {
      const { x, y } = doc;
      doc
        .moveTo(doc.page.margins.left, y + yOffset)
        .lineTo(pageWidth - doc.page.margins.right, y + yOffset)
        .lineWidth(0.5)
        .strokeColor('#E5E7EB')
        .stroke();
      doc.moveDown(1);
    };

    const ensureSpace = (needed = 80) => {
      if (doc.y + needed > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
      }
    };

    const fmtDateDDMMYYYY = (d: Date) => {
      const dd = String(d.getDate()).padStart(2, '0');
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    };

    // Tabla simple con salto de página automático
    const drawTable = (
      rows: Array<{ nombre: string; unidad: string; pedido: number }>,
      colPercents = [60, 20, 20] as [number, number, number]
    ) => {
      const [c1, c2, c3] = colPercents.map((p) => Math.floor((p / 100) * contentWidth));
      const rowHeight = 22;

      // Header
      ensureSpace(60);
      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor('#111827');

      const xStart = doc.page.margins.left;
      const yStart = doc.y + 6;

      doc
        .rect(xStart, yStart, contentWidth, rowHeight)
        .fillOpacity(1)
        .fill('#F9FAFB');

      doc
        .fillColor('#111827')
        .text('Nombre', xStart + 10, yStart + 6, { width: c1 - 12 })
        .text('Unidad', xStart + c1 + 10, yStart + 6, { width: c2 - 12 })
        .text('Pedido', xStart + c1 + c2 + 10, yStart + 6, { width: c3 - 12, align: 'right' });

      doc.moveTo(xStart, yStart + rowHeight).lineTo(xStart + contentWidth, yStart + rowHeight).lineWidth(0.5).strokeColor('#E5E7EB').stroke();

      // Rows
      let y = yStart + rowHeight;
      doc.font('Helvetica').fontSize(10).fillColor('#111827');

      for (const r of rows) {
        // salto de página si no entra la fila
        if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
          doc.addPage();
          y = doc.y;
          // redibujar header en nueva página
          doc.font('Helvetica-Bold').fontSize(10);
          const yH = y + 6;
          doc
            .rect(xStart, yH, contentWidth, rowHeight)
            .fillOpacity(1)
            .fill('#F9FAFB');
          doc
            .fillColor('#111827')
            .text('Nombre', xStart + 10, yH + 6, { width: c1 - 12 })
            .text('Unidad', xStart + c1 + 10, yH + 6, { width: c2 - 12 })
            .text('Pedido', xStart + c1 + c2 + 10, yH + 6, { width: c3 - 12, align: 'right' });
          doc.moveTo(xStart, yH + rowHeight).lineTo(xStart + contentWidth, yH + rowHeight).lineWidth(0.5).strokeColor('#E5E7EB').stroke();
          y = yH + rowHeight;
          doc.font('Helvetica').fontSize(10).fillColor('#111827');
        }

        // fila
        doc
          .fillOpacity(1)
          .rect(xStart, y, contentWidth, rowHeight)
          .fill('#FFFFFF');

        doc
          .fillColor('#111827')
          .text(r.nombre, xStart + 10, y + 6, { width: c1 - 12 })
          .text(r.unidad, xStart + c1 + 10, y + 6, { width: c2 - 12 })
          .text(String(r.pedido), xStart + c1 + c2 + 10, y + 6, { width: c3 - 12, align: 'right' });

        // línea inferior
        doc
          .moveTo(xStart, y + rowHeight)
          .lineTo(xStart + contentWidth, y + rowHeight)
          .lineWidth(0.5)
          .strokeColor('#E5E7EB')
          .stroke();

        y += rowHeight;
      }

      doc.y = y + 10;
    };

    // --- Encabezado ---
    doc.font('Helvetica-Bold').fontSize(18).fillColor('#111827').text(`Pedido ${pedido.id}`, {
      align: 'left',
    });
    doc.moveDown(0.2);

    doc.font('Helvetica').fontSize(10).fillColor('#374151');
    const fechaStr = fmtDateDDMMYYYY(new Date(pedido.fecha));
    const sucursalNombre = pedido.sucursal?.nombre ?? '—';
    doc.text(`Sucursal: ${sucursalNombre}    Fecha: ${fechaStr}`);
    drawHr(8);

    // 4) Render: por cada TipoStock y Rubro
    for (const tipoStock of Object.keys(grouped)) {
      ensureSpace(60);

      // “Píldora”/header tipo stock (fondo beige claro)
      const yTop = doc.y + 6;
      doc
        .rect(doc.page.margins.left, yTop, contentWidth, 24)
        .fillOpacity(1)
        .fill('#EEE7D9');
      doc
        .fillColor('#111827')
        .font('Helvetica-Bold')
        .fontSize(12)
        .text(tipoStock, doc.page.margins.left + 10, yTop + 6);

      doc.moveDown(2);

      const rubros = grouped[tipoStock];
      for (const rubro of Object.keys(rubros)) {
        ensureSpace(50);

        // Subtítulo de Rubro
        doc
          .font('Helvetica-Bold')
          .fontSize(14)
          .fillColor('#111827')
          .text(rubro);
        doc.moveDown(0.5);

        // Tabla
        const rows = rubros[rubro]
          .filter((d) => (d.cantidadPedido ?? 0) > 0) // si querés mostrar solo los que piden > 0
          .map((d) => ({
            nombre: d.insumo?.nombre ?? '—',
            unidad: d.insumo?.unidadDeMedida?.nombre ?? '—',
            pedido: d.cantidadPedido ?? 0,
          }));

        // Si rubro no tiene filas (p. ej. todos 0), igual podés mostrar tabla vacía o saltear:
        if (rows.length === 0) {
          doc.font('Helvetica-Oblique').fontSize(10).fillColor('#6B7280').text('Sin items.');
          doc.moveDown(0.6);
          continue;
        }

        drawTable(rows);
        doc.moveDown(0.6);
      }

      doc.moveDown(0.6);
    }

    // Pie de página opcional (número de página)
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      const footerY = doc.page.height - doc.page.margins.bottom + 18;
      doc.font('Helvetica').fontSize(9).fillColor('#9CA3AF');
      doc.text(
        `Página ${i + 1} de ${pageCount}`,
        doc.page.margins.left,
        footerY,
        { width: contentWidth, align: 'right' },
      );
    }

    doc.end();

    // 5) Devolver buffer
    return await new Promise<Buffer>((resolve, reject) => {
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });
  }


async generarYPersistirPDF(pedidoId: number) {
  const pedido = await this.prismaService.pedido.findUnique({
    where: { id: pedidoId },
    include: { sucursal: true }, // 👈 para tener el nombre de la sucursal
  });

  if (!pedido) {
    throw new Error(`Pedido ${pedidoId} no encontrado`);
  }

  const bufferStock = await this.generateStockPdfById(pedidoId);
  const bufferPedido = await this.generatePedidoPdfById(pedidoId);

  // Armar fecha DDMMYYYY
  const fecha = new Date(pedido.fecha);
  const fechaStr = `${String(fecha.getDate()).padStart(2, '0')}${String(
    fecha.getMonth() + 1
  ).padStart(2, '0')}${fecha.getFullYear()}`;

  // Limpiar espacios del nombre sucursal
  const sucursalNombre = pedido.sucursal.nombre.replace(/\s+/g, '_');

  // Nombre final del archivo
  const fileNameStock = `${pedido.id}_STOCK_${sucursalNombre}_${fechaStr}.pdf`;
  const fileNamePedido = `${pedido.id}_PEDIDO_${sucursalNombre}_${fechaStr}.pdf`;

  // Ruta absoluta
  const folderPath = process.env.PDF_FOLDER;
  if (!folderPath) {
    throw new Error('La variable de entorno PDF_FOLDER no está definida');
  }
  await fs.mkdir(folderPath, { recursive: true }); // asegura que exista

  const filePathStock = path.join(folderPath, fileNameStock);
  const filePathPedido = path.join(folderPath, fileNamePedido);

  // Guardar el archivo en disco
  await fs.writeFile(filePathStock, bufferStock);
  
  await fs.writeFile(filePathPedido, bufferPedido);


 await this.sendWsp(process.env.WSP_REPORTE,filePathStock)
 await this.sendWsp(process.env.WSP_REPORTE,filePathPedido)
}


async sendWsp(number, filePath) {
  try {
    // obtener solo el nombre del archivo
    const fileName = path.basename(filePath);

    const response = await fetch(process.env.NOTIFICATION_API_URL+"/whatsapp/send", {
      method: "POST",
      headers: {
        "accept": "*/*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        number: number,
        file: filePath,           
        fileName: fileName,
        mimetype: "application/pdf",
      })
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Respuesta del servidor:", data);
  } catch (err) {
    console.error("Error al enviar WhatsApp:", err);
  }
}
  }

