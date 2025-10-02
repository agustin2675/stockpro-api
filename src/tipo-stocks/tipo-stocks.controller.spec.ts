import { Test, TestingModule } from '@nestjs/testing';
import { TipoStocksController } from './tipo-stocks.controller';
import { TipoStocksService } from './tipo-stocks.service';

describe('TipoStocksController', () => {
  let controller: TipoStocksController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TipoStocksController],
      providers: [TipoStocksService],
    }).compile();

    controller = module.get<TipoStocksController>(TipoStocksController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
