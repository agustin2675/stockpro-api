import { Test, TestingModule } from '@nestjs/testing';
import { SucursalesController } from './sucursales.controller';
import { SucursalesService } from './sucursales.service';

describe('SucursalesController', () => {
  let controller: SucursalesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SucursalesController],
      providers: [SucursalesService],
    }).compile();

    controller = module.get<SucursalesController>(SucursalesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
