import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  getStatus() {
    return {
      status: 'ok',
      service: 'mounjaro-discount-api',
      timestamp: new Date().toISOString(),
    };
  }
}
