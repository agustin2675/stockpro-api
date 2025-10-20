import { Injectable, NotFoundException } from '@nestjs/common';
import { CreatePedidoDto, DetallePedidoDto } from './dto/create-pedido.dto';
import { UpdatePedidoDto } from './dto/update-pedido.dto';
import { PrismaService } from 'src/prisma/prisma.service';
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
    const cantidadPedido = detalle.cantidadPedido >= sucInsumo.cantidadMinima ? detalle.cantidadPedido : 0;

    return {
      cantidadPedido,
      cantidadReal: detalle.cantidadReal,
      cantidadIdeal: detalle.cantidadIdeal,
      insumo: { connect: { id: detalle.insumo_id } },
      tipoStock: { connect: { id: detalle.tipoStock_id } }
    };
  });

  await this.syncCantidadIdealSucursalInsumo(sucursal_id, detalles);


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

 private async syncCantidadIdealSucursalInsumo(sucursal_id: number, detalles: DetallePedidoDto[]) {
  const updates = detalles
    .filter(d => d.cantidadIdeal !== undefined && d.cantidadIdeal !== null)
    .map(d =>
      this.prismaService.sucursalInsumo.upsert({
        where: {
          sucursal_id_tipoStock_id_insumo_id: {
            sucursal_id,
            tipoStock_id: d.tipoStock_id,
            insumo_id: d.insumo_id,
          },
        },
        update: { cantidadIdeal: Number(d.cantidadIdeal) },
        create: {
          sucursal_id,
          tipoStock_id: d.tipoStock_id,
          insumo_id: d.insumo_id,
          cantidadIdeal: Number(d.cantidadIdeal),
          cantidadReal: 0,
          cantidadMinima: 0,
        },
      })
    );

  await Promise.all(updates);
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

 async update(id: number, updatePedidoDto: UpdatePedidoDto) {
  const { sucursal_id, dateTime, detalles } = updatePedidoDto;

  return this.prismaService.$transaction(async (tx) => {
    const pedido = await tx.pedido.findUnique({
      where: { id },
      select: { id: true, sucursal_id: true },
    });
    if (!pedido) throw new NotFoundException('Pedido no encontrado');

    // Si no vienen detalles, opcionalmente actualizamos fecha/sucursal y devolvemos
    if (!detalles || detalles.length === 0) {
      if (dateTime || sucursal_id) {
        await tx.pedido.update({
          where: { id },
          data: {
            ...(dateTime ? { fecha: dateTime } : {}),
            ...(sucursal_id ? { sucursal_id } : {}),
          },
        });
      }
      return tx.pedido.findUnique({
        where: { id },
        include: { detallePedidos: { include: { insumo: true } }, sucursal: true },
      });
    }

    const sucursalParaBuscar = sucursal_id ?? pedido.sucursal_id;

    // Traemos SucursalInsumo para los insumos entrantes
    const insumosEntrantes = Array.from(new Set(detalles.map(d => d.insumo_id)));
    const sucInsumos = await tx.sucursalInsumo.findMany({
      where: {
        sucursal_id: sucursalParaBuscar,
        insumo_id: { in: insumosEntrantes.length ? insumosEntrantes : [-1] },
      },
      select: {
        insumo_id: true,
        cantidadReal: true,
        cantidadMinima: true,
      },
    });
    const mapaSucInsumo = new Map(sucInsumos.map(si => [si.insumo_id, si]));

    // Upsert SOLO de lo que viene (no borramos lo que no viene)
    for (const d of detalles) {
      const si = mapaSucInsumo.get(d.insumo_id);
      if (!si) {
        throw new Error(
          `No existe SucursalInsumo para insumo_id=${d.insumo_id} en sucursal_id=${sucursalParaBuscar}`
        );
      }

      //const resta = si.cantidadReal - si.cantidadIdeal;
      const cantidadPedido = d.cantidadPedido >= si.cantidadMinima ? d.cantidadPedido : 0;

      await tx.detallePedido.upsert({
        where: {
          pedido_id_insumo_id_tipoStock_id: {
            pedido_id: id,
            insumo_id: d.insumo_id,
            tipoStock_id: d.tipoStock_id,
          },
        },
        create: {
          pedido_id: id,
          insumo_id: d.insumo_id,
          tipoStock_id: d.tipoStock_id,
          cantidadPedido,               // calculado desde SucursalInsumo
          cantidadReal: d.cantidadReal, // tomado de SucursalInsumo
          cantidadIdeal: d.cantidadIdeal 
        },
        update: {
          cantidadPedido,               // recalculado siempre
          cantidadReal: d.cantidadReal,
          cantidadIdeal: d.cantidadIdeal
        },
      });
    }

    // Actualizamos meta (fecha/sucursal) si vino algo
    if (dateTime || sucursal_id) {
      await tx.pedido.update({
        where: { id },
        data: {
          ...(dateTime ? { fecha: dateTime } : {}),
          ...(sucursal_id ? { sucursal_id } : {}),
        },
      });
    }
    await this.syncCantidadIdealSucursalInsumo(sucursalParaBuscar, detalles);

    // Devolvemos el pedido actualizado
    return tx.pedido.findUnique({
      where: { id },
      include: {
        detallePedidos: { include: { insumo: true } },
        sucursal: true,
      },
    });
  });
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
  // 1) Datos
  const pedido = await this.prismaService.pedido.findUnique({
    where: { id: pedidoId },
    include: {
      sucursal: true,
      detallePedidos: {
        include: {
          insumo: { include: { unidadDeMedida: true, rubro: true } },
          tipoStock: true,
        },
        orderBy: { id: 'asc' },
      },
    },
  });
  if (!pedido) throw new Error(`Pedido ${pedidoId} no encontrado`);

  // 2) Agrupar TipoStock -> Rubro
  type Item = (typeof pedido.detallePedidos)[number];
  const grouped: Record<string, Record<string, Item[]>> = {};
  for (const det of pedido.detallePedidos) {
    const tipo = det.tipoStock?.nombre ?? 'Sin tipo';
    const rubro = det.insumo?.rubro?.nombre ?? 'Sin rubro';
    if (!grouped[tipo]) grouped[tipo] = {};
    if (!grouped[tipo][rubro]) grouped[tipo][rubro] = [];
    grouped[tipo][rubro].push(det);
  }

  // === Config térmica 80mm ===
  const WIDTH_PT = 226.77;        // 80 mm
  const PROV_HEIGHT = 4000;       // alto grande; se recorta al final
  const MARGIN = 8;               // márgenes chicos
  const LINE_H = 18;              // alto fila

  const doc = new PDFDocument({
    size: [WIDTH_PT, PROV_HEIGHT],
    margins: { top: MARGIN, left: MARGIN, right: MARGIN, bottom: MARGIN },
    bufferPages: false,
  });

  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));

  const contentWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;

  // === Helpers ===
  const hr = () => {
    const y = doc.y + 2;
    doc
      .moveTo(doc.page.margins.left, y)
      .lineTo(doc.page.margins.left + contentWidth, y)
      .lineWidth(0.5)
      .strokeColor('#000')
      .stroke();
    doc.moveDown(0.5);
  };

  const fmtDate = (d: Date) => {
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const truncToWidth = (text: string, maxWidth: number) => {
    if (!text) return '';
    const ell = '…';
    if (doc.widthOfString(text) <= maxWidth) return text;
    let lo = 0, hi = text.length;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      const s = text.slice(0, mid) + ell;
      if (doc.widthOfString(s) <= maxWidth) lo = mid + 1; else hi = mid;
    }
    return text.slice(0, Math.max(0, lo - 1)) + ell;
  };

  const drawTitleOneLine = (text: string, opts: { level: 2 | 3; topGap?: number; bottomGap?: number }) => {
    const { level, topGap = 2, bottomGap = 2 } = opts;
    const size = level === 2 ? 13 : 12;
    const t = String(text ?? '').replace(/\s+/g, ' ').trim();
    if (topGap) doc.moveDown(topGap / 10);
    doc.font('Helvetica-Bold').fontSize(size).fillColor('#000');
    // dibuja 1 línea con ellipsis dentro del ancho disponible
    const y0 = doc.y;
    const oneLine = truncToWidth(t, contentWidth);
    doc.text(oneLine, doc.page.margins.left, y0, { width: contentWidth, height: size + 4 });
    doc.y = y0 + size + 2;
    if (bottomGap) doc.moveDown(bottomGap / 10);
  };

  const drawH1 = (txt: string) => {
    doc.font('Helvetica-Bold').fontSize(16).fillColor('#000').text(txt, { align: 'left' });
  };

  const drawTable = (rows: Array<{ nombre: string; um: string; ped: number }>) => {
    // Nombre 62% | UM 18% | Ped 20%
    const c1 = Math.floor(contentWidth * 0.62);
    const c2 = Math.floor(contentWidth * 0.18);
    const c3 = contentWidth - c1 - c2;
    const x0 = doc.page.margins.left;

    // Header
    doc.font('Helvetica-Bold').fontSize(11).fillColor('#000');
    const yHeader = doc.y;
    doc.text('Nombre', x0, yHeader, { width: c1 });
    doc.text('UM',     x0 + c1, yHeader, { width: c2 });
    doc.text('Ped',    x0 + c1 + c2, yHeader, { width: c3, align: 'right' });
    doc.y = yHeader + LINE_H - 6;
    hr();

    // Filas
    doc.font('Helvetica').fontSize(11).fillColor('#000');
    for (const r of rows) {
      const y = doc.y;
      const nombre = truncToWidth(r.nombre, c1 - 2);
      const um = truncToWidth(r.um, c2 - 2);
      const ped = String(r.ped ?? 0);

      doc.text(nombre, x0, y, { width: c1, height: LINE_H });
      doc.text(um, x0 + c1, y, { width: c2, height: LINE_H });
      doc.text(ped, x0 + c1 + c2, y, { width: c3, height: LINE_H, align: 'right' });

      doc.y = y + LINE_H - 4;
    }
    doc.moveDown(0.3);
  };

  // === Encabezado ===
  drawH1(`Pedido ${pedido.id}`);
  const fechaStr = fmtDate(new Date(pedido.fecha));
  const sucursalNombre = pedido.sucursal?.nombre ?? '—';
  doc.font('Helvetica').fontSize(10).fillColor('#000')
     .text(`Sucursal: ${sucursalNombre}`)
     .text(`Fecha: ${fechaStr}`);
  hr();

  // === Contenido ===
  for (const tipo of Object.keys(grouped)) {
    drawTitleOneLine(tipo, { level: 2, topGap: 4, bottomGap: 3 });

    const rubros = grouped[tipo];
    for (const rubro of Object.keys(rubros)) {
      drawTitleOneLine(rubro, { level: 3, topGap: 2, bottomGap: 2 });

      const rows = rubros[rubro]
        .filter(d => (d.cantidadPedido ?? 0) > 0)
        .map(d => ({
          nombre: d.insumo?.nombre ?? '—',
          um: d.insumo?.unidadDeMedida?.nombre ?? '—',
          ped: d.cantidadPedido ?? 0,
        }));

      if (!rows.length) {
        doc.font('Helvetica-Oblique').fontSize(10).text('Sin ítems.');
        doc.moveDown(0.4);
        continue;
      }

      doc.moveDown(0.2);
      drawTable(rows);

      // separador fino entre rubros
      doc.moveDown(0.2);
      hr();
    }
  }

  // === Recorte a una sola página ===
  const finalHeight = Math.max(Math.ceil(doc.y + MARGIN), 120);
  doc.page.height = finalHeight;

  doc.end();

  // 3) Buffer
  return await new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
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

  //const bufferStock = await this.generateStockPdfById(pedidoId);
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
  //await fs.writeFile(filePathStock, bufferStock);
  
  await fs.writeFile(filePathPedido, bufferPedido);


 //await this.sendWsp(process.env.WSP_REPORTE,filePathStock)
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

