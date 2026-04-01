import { HealthService } from './modules/health/health.service';

describe('HealthService', () => {
  let service: HealthService;

  beforeEach(() => {
    service = new HealthService();
  });

  it('returns the base API health payload', () => {
    expect(service.getStatus()).toMatchObject({
      status: 'ok',
      service: 'mounjaro-discount-api',
    });
  });
});
