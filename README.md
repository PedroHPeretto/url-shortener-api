# 🔗 URL Shortener API (Encurtador de URL)

## Sumário

* [Descrição](#descrição)
* [Tecnologias & Ferramentas](#tecnologias--ferramentas)
* [Funcionalidades](#funcionalidades)
* [Como rodar o projeto](#como-rodar-o-projeto)
* [Outros comandos](#outros-comandos)
* [Documentação da API](#documentação-da-api-swagger)
* [Escalabilidade e melhorias futuras](#escalabilidade-e-melhorias-futuras)
* [Licença](#licença)

## Descrição

>API REST robusta e escalável para encurtamento de URLs, desenvolvida com **Node.js (NestJS)** e **PostgreSQL**. O projeto oferece funcionalidades de encurtamento público, redirecionamento com contagem de cliques e gerenciamento de links para usuários autenticados.

Este projeto foi desenvolvido como parte de um teste técnico para um processo seletivo.

## Tecnologias & Ferramentas

* **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
* **Framework:** [NestJS](https://nestjs.com/) ([Node.js](https://nodejs.org/pt))
* **Banco de Dados:** [PostgreSQL](https://www.postgresql.org/) (via [TypeORM](https://typeorm.io/))
* **Containerização:** [Docker](https://www.docker.com/) & [Docker Compose](https://docs.docker.com/compose/)
* **Orquestração:** [Kubernetes](https://kubernetes.io/pt-br/)
* **Autenticação:** [JWT (JSON Web Token)](https://www.jwt.io/) & [Passport](https://docs.nestjs.com/recipes/passport)
* **Testes:** [Jest](https://jestjs.io/) (Unitários e Cobertura)
* **Qualidade de Código:** [ESLint](https://eslint.org/), [Prettier](https://prettier.io/), [Husky](https://www.npmjs.com/package/husky), [Commitlint](https://commitlint.js.org/)
* **Documentação:** [Swagger](https://swagger.io/) ([OpenAPI](https://www.openapis.org/))

## Funcionalidades

* **Público:**
    * Encurtar URLs (gera um hash único de 6 caracteres).
    * Redirecionar para URL original (contabilizando cliques).
* **Privado (Autenticado):**
    * Cadastro e Login de usuários (JWT).
    * Listagem de URLs encurtadas pelo usuário (com contador de acessos).
    * Edição de URL de destino.
    * Exclusão lógica (Soft Delete) de URLs.
* **Outros:**
    * Ambiente 100% containerizado com Docker.
    * API pronta para orquestração com Kubernetes.
    * Testes Unitários cobrindo 100% dos Services críticos.
    * Documentação automática com Swagger.
    * Validação rigorosa de dados (DTOs + Pipes Globais).
    * Padronização de Erros (Global Exception Filter).
    * Logs estruturados para observabilidade.
    * CI/CD (GitHub Actions) configurado para Lint, Testes e Deploy.
    * Versionamento semântico automatizado (Standard Version).
    * Deploy na AWS.

---

## Como Rodar o Projeto

### Pré-requisitos
* **Docker** e **Docker Compose** instalados.

### Passo a Passo (Recomendado)

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/PedroHPeretto/url-shortener-api.git
    cd url-shortener-api
    ```

2.  **Configure as variáveis de ambiente**
    ```bash
    cp .env.example .env
    ```

3.  **Suba o ambiente com Docker:**
    Este comando irá construir a imagem da aplicação e subir o banco de dados PostgreSQL automaticamente.
    ```bash
    make build
    ```

4.  **Acesse a API:**
    A aplicação estará rodando em: `http://localhost:3000`

---

## Outros comandos

```bash
# desenvolvimento
$ npm run start

# modo assistido
$ npm run start:dev

# modo de produção
$ npm run start:prod

#construa a versão para produção
$ npm run build

# testes unitários
$ npm run test

# cobertura de testes
$ npm run test:cov
```

---

## Documentação da API (Swagger)

A documentação interativa completa de todos os endpoints está disponível em:

**[http://localhost:3000/api-docs](http://localhost:3000/api-docs)**

Lá você pode testar as requisições, ver os esquemas de dados (DTOs) e as respostas de erro padronizadas.

---

## Escalabilidade e Melhorias Futuras

Este sistema foi desenhado inicialmente para escalar verticalmente (adicionando recursos à máquina atual). No entanto, para suportar um volume massivo de acessos (milhões de cliques/dia) e escalar **horizontalmente** (várias instâncias da API), os seguintes desafios e melhorias foram identificados:

### 1. Geração de Hash Distribuída (Colisões)
* **Desafio:** Com múltiplas instâncias gerando hashes aleatórios (`nanoid`) simultaneamente, a chance de colisão aumenta, e a verificação no banco (`findOne`) se torna um gargalo de performance.
* **Solução:** Implementar um serviço de geração de IDs pré-alocados (como o Twitter Snowflake) ou um *Key Generation Service* (KGS) separado, que fornece chaves únicas garantidas para as instâncias da API, eliminando a necessidade de verificar o banco na criação, assim reduzindo o número de consultas drasticamente.

### 2. Contagem de Cliques (Escrita Excessiva)
* **Desafio:** Cada redirecionamento gera um `UPDATE` síncrono no banco de dados. Em alta carga, isso pode travar o banco ("Database Locking").
* **Solução:** Utilizar uma estratégia de **"Write-Behind"** com **Redis**. O clique apenas incrementa um contador no Redis (operação extremamente rápida em memória). Um *worker* assíncrono coleta esses dados periodicamente e atualiza o banco PostgreSQL em lote (*batch update*).

### 3. Cache de Redirecionamento
* **Melhoria:** URLs populares são acessadas frequentemente. Consultar o Postgres a cada clique é ineficiente.
* **Solução:** Cachear o mapeamento `short_code -> original_url` no **Redis**. A aplicação consulta primeiro o Redis; se não achar, busca no banco e salva no cache.

### 4. Banco de Dados (Leitura vs. Escrita)
* **Melhoria:** Separar a infraestrutura de banco de dados.
* **Solução:** Criar **Réplicas de Leitura** para os redirecionamentos (GET) e manter a instância Principal apenas para criação de links e contabilização (escrita).

---

## Licença

Este projeto está sob a licença [MIT](https://github.com/nestjs/nest/blob/master/LICENSE).
