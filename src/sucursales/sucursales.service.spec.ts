import { Test, TestingModule } from '@nestjs/testing';
import { SucursalesService } from './sucursales.service';

describe('SucursalesService', () => {
  let service: SucursalesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SucursalesService],
    }).compile();

    service = module.get<SucursalesService>(SucursalesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
