# RepurposeAI BullMQ E2E Harness

Este pacote isolado valida o ciclo completo de filas BullMQ (streams) usado no projeto **RepurposeAI**, simulando cenários de sucesso, falha com retries/backoff e erro de conexão ao Redis.

## Pré-requisitos

- Windows com Node.js **20.17.0** ou superior
- Instância Redis acessível (Azure Redis com TLS ou Redis local) exposta via `REDIS_URL`

## Passo a passo rápido

```bash
cd e2e-bullmq
copy env.example .env.local   # PowerShell: Copy-Item env.example .env.local
npm ci
npx tsx src/run.ts --jobs 100 --fail-rate 0.1
```

### Flags suportadas

| Flag                         | Descrição                                                                                     | Default                                 |
| ---------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------- |
| `--jobs <number>`            | Quantidade de jobs a enfileirar.                                                              | `process.env.JOBS` (100)                |
| `--fail-rate <number>`       | Proporção (0-1) de jobs que falham nas primeiras tentativas para acionar os retries.          | `process.env.FAIL_RATE` (0.1)           |
| `--queue <string>`           | Prefixo do nome da fila. Um sufixo de timestamp é adicionado automaticamente para isolamento. | `process.env.QUEUE_NAME`                |
| `--concurrency <number>`     | Número de processadores concorrentes do worker.                                               | `process.env.CONCURRENCY` (1)           |
| `--bad-url <string>`         | URL inválida temporária para simular erro de conexão antes de usar a URL correta.             | _opcional_                              |
| `--backoff-initial <number>` | Delay inicial (ms) do backoff exponencial.                                                    | `process.env.BACKOFF_INITIAL_MS` (5000) |
| `--retries <number>`         | Quantidade de tentativas por job.                                                             | `process.env.RETRIES` (3)               |

Todos os parâmetros também podem ser definidos em `.env.local`.

### Configurando Redis Azure

Copie `env.example` para `.env.local` e ajuste `REDIS_URL` para o endpoint do Azure Redis com TLS, por exemplo:

```
rediss://:SUA_SENHA@seu-cache.redis.cache.windows.net:6380
```

Os demais parâmetros (fila, jobs, retries, etc.) podem ser ajustados pelas variáveis listadas no arquivo `.env.local`.

### Simular apenas erro de conexão

```bash
npx tsx src/simulate_connection_fault.ts --bad-url rediss://:wrong@invalid:6380
```

## Comandos de exemplo

```bash
# 1) Preparar ambiente de teste isolado
cd e2e-bullmq
copy env.example .env.local   # PowerShell: Copy-Item env.example .env.local
npm ci

# 2) Rodar ciclo completo com 100 jobs e 10% de falha simulada
npx tsx src/run.ts --jobs 100 --fail-rate 0.1

# 3) Forçar erro de conexão antes (URL inválida), depois seguir normal
npx tsx src/run.ts --jobs 50 --fail-rate 0.2 --bad-url rediss://:wrong@invalid:6380

# 4) Ajustar política (opcional)
npx tsx src/run.ts --jobs 200 --retries 3 --backoff-initial 5000
```

O script `src/run.ts` imprime logs humanos durante a execução e encerra exibindo **apenas um JSON** no stdout com as métricas finais da fila (contagens, latência de `PING`, duração total, etc.).
