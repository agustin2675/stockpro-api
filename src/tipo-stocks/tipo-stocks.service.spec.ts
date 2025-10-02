import { Test, TestingModule } from '@nestjs/testing';
import { TipoStocksService } from './tipo-stocks.service';

describe('TipoStocksService', () => {
  let service: TipoStocksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TipoStocksService],
    }).compile();

    service = module.get<TipoStocksService>(TipoStocksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
