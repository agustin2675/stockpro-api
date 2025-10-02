import { Test, TestingModule } from '@nestjs/testing';
import { UnidadesMedidaController } from './unidades-medida.controller';
import { UnidadesMedidaService } from './unidades-medida.service';

describe('UnidadesMedidaController', () => {
  let controller: UnidadesMedidaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UnidadesMedidaController],
      providers: [UnidadesMedidaService],
    }).compile();

    controller = module.get<UnidadesMedidaController>(UnidadesMedidaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
