import { Test, TestingModule } from '@nestjs/testing';
import { RubrosService } from './rubros.service';

describe('RubrosService', () => {
  let service: RubrosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RubrosService],
    }).compile();

    service = module.get<RubrosService>(RubrosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
