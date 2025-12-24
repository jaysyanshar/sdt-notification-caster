import { PlaceholderService } from '../../../../src/modules/placeholder/placeholder.service';

describe('PlaceholderService', () => {
  let service: PlaceholderService;

  beforeEach(() => {
    service = new PlaceholderService();
  });

  describe('getHelloWorld', () => {
    it('should return "Hello World" string', async () => {
      const result = await service.getHelloWorld();
      expect(result).toBe('Hello World');
    });

    it('should return a string type', async () => {
      const result = await service.getHelloWorld();
      expect(typeof result).toBe('string');
    });

    it('should not return null or undefined', async () => {
      const result = await service.getHelloWorld();
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
    });
  });
});
