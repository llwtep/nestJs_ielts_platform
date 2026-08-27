import { ConfigService } from '@nestjs/config';

// один источник настроек Redis для очередей и кэша
export function redisConnection(config: ConfigService) {
    const url = config.get<string>('REDIS_URL');
    if (!url) return { host: '127.0.0.1', port: 6379 };
    const parsed = new URL(url);
    return {
        host: parsed.hostname,
        port: Number(parsed.port || 6379),
        username: parsed.username || undefined,
        password: parsed.password || undefined,
    };
}
