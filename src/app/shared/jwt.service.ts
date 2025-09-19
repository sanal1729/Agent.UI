// jwt.service.ts
import { Injectable } from '@angular/core';
import { jwtDecode}  from 'jwt-decode';

@Injectable({ providedIn: 'root' })
export class JwtService {
  decode<T = any>(token: string): T | null {
    try {
      return jwtDecode<T>(token);
    } catch {
      return null;
    }
  }

  isExpired(token: string): boolean {
    const decoded = this.decode<any>(token);
    return !decoded?.exp || decoded.exp < Math.floor(Date.now() / 1000);
  }
}
