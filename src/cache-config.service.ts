import { Injectable } from '@nestjs/common';
import { CacheOptionsFactory, CacheModuleOptions } from '@nestjs/cache-manager';
import { Keyv } from 'keyv';
import { KeyvCacheableMemory } from 'cacheable';
import KeyvRedis from '@keyv/redis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CacheConfigService implements CacheOptionsFactory {
    constructor(private configService: ConfigService) {}
    createCacheOptions(): CacheModuleOptions {
        return {
        stores: [
            new Keyv({
            store: new KeyvCacheableMemory({ 
                ttl: 60 * 60 * 1000, 
                lruSize: 1000 
            }),
            }),
            new KeyvRedis(this.configService.get<string>('REDIS_URL')),
        ],
        };
    }
}