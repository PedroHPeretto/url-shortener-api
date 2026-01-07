# 🔗 URL Shortener API (Encurtador de URL)

---

## Sumário

* [Descrição](#descrição)
* [Tecnologias & Ferramentas](#tecnologias--ferramentas)
* [Funcionalidades](#funcionalidades)
* [Como rodar o projeto](#como-rodar-o-projeto)
* [Outros comandos](#outros-comandos)
* [Documentação da API](#documentação-da-api-swagger)
* [Escalabilidade e melhorias futuras](#escalabilidade-e-melhorias-futuras)
* [Licença](#licença)

---

## Descrição

>API REST robusta e escalável para encurtamento de URLs, desenvolvida com **Node.js (NestJS)** e **PostgreSQL**. O projeto oferece funcionalidades de encurtamento público, redirecionamento com contagem de cliques e gerenciamento de links para usuários autenticados.

Este projeto foi desenvolvido como parte de um teste técnico para um processo seletivo.

---

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

---

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
# rodar API em mode de desenvolvimento
$ npm run start

# rodar API em modo assistido
$ npm run start:dev

# rodar API em modo de produção
$ npm run start:prod

# construir a versão para produção
$ npm run build

# rodar testes unitários
$ npm run test

# verificar cobertura de testes
$ npm run test:cov

# build local do container da API
$ npm run docker-compose:build

# subir container local da API
$ npm run docker-compose:up

# derrubar container local da API
$ npm run docker-compose:down
```

---

## Documentação da API (Swagger)

A documentação interativa completa de todos os endpoints está disponível em:

**[http://localhost:3000/api-docs](http://localhost:3000/api-docs)**

Lá você pode testar as requisições, ver os esquemas de dados (DTOs) e as respostas de erro padronizadas.

---

## Escalabilidade e Melhorias Futuras

### 1. Infraestrutura Cloud Native (AWS)
* **Desafio:** O cluster K3s roda em ambiente virtualizado local, restringindo a escalabilidade vertical e horizontal aos recursos da máquina host.
* **Solução:** Migrar o cluster para uma solução gerenciada em nuvem (Amazon EKS ou instâncias EC2), habilitando Auto-scaling Groups para absorver picos de tráfego reais.

### 2. Otimização de recursos (Rightsizing)
* **Desafio:** Embora o deployment atual possua limites de CPU e Memória configurados, eles foram definidos de forma especulativa. Sem base em dados reais de uso sob estresse, existe o risco iminente de superalocação (desperdício de recursos/custo elevado) ou subalocação (CPU Throttling e erros de OOMKilled) durante picos de tráfego.
* **Solução:** Realizar baterias de Testes de Carga (Load Testing) monitorados para identificar o perfil real de consumo da aplicação. Com esses dados, aplicar o Rightsizing (ajuste fino) dos requests e limits, possivelmente utilizando o Vertical Pod Autoscaler (VPA) para recomendações automáticas baseadas em histórico.

### 3. Observabilidade e Logs Estruturados
* **Desafio:** Logs em texto puro (stdout) dificultam a depuração e não permitem métricas agregadas.
* **Solução:** Implementar Structured Logging (JSON) e integrar com uma stack de observabilidade (ex: Prometheus/Grafana para métricas e Loki ou ELK Stack para logs centralizados), permitindo a criação de alertas e dashboards em tempo real.

### 4. Banco de dados gerenciado (DBaaS)
* **Desafio:** Manter bancos de dados "stateful" dentro do Kubernetes (como feito atualmente) adiciona complexidade operacional na gestão de volumes persistentes (PV/PVC) e backups, e reduz eficiência (I/O).
* **Solução:** Desacoplar a camada de dados utilizando AWS RDS (PostgreSQL). Isso garante backups automáticos, patches de segurança e maior disponibilidade (Multi-AZ).

### 5. Estratégia de 'Write-behind' (Redis)
* **Desafio:** Cada redirecionamento gera um `UPDATE` síncrono no banco de dados. Em alta concorrência, isso causa 'Row Locking' e degrada e performance.
* **Solução:** Utilizar Redis para incrementar contadores em memória (operação O(1)). Um worker assíncrono consolidará esses dados e persistirá no PostgreSQL em lote (Batch Update), reduzindo a carga de escrita no banco em mais de 90%.

### 6. Caching de Redirecionamento
* **Melhoria:** URLs populares (Hot Data) são consultadas frequentemente no banco, adicionando latência desnecessária.
* **Solução:** Implementar o padrão Cache-Aside com Redis. A aplicação buscará o short_code primeiro na memória; apenas em caso de cache miss consultará o banco de dados.

### 7. Leitura vs. Escrita (CQRS Leve)
* **Melhoria:** Otimizar o uso de recursos do banco de dados.
* **Solução:** Configurar Read Replicas no PostgreSQL. Todo tráfego de redirecionamento (leitura massiva) será direcionado para as réplicas, deixando a instância principal (Writer) dedicada apenas para a criação de novas URLs.

### 8. Infraestrutura como código (IaC)
* **Melhoria:** Automatizar processos de criação manual de manifestos Kubernetes.
* **Solução:** Substituir a criação manual de recursos e aplicação de manifestos (kubectl apply) por Terraform para provisionar a infraestrutura e Helm ou ArgoCD para gerenciar o ciclo de vida da aplicação (GitOps).

---

## Licença

Este projeto está sob a licença [MIT](https://github.com/nestjs/nest/blob/master/LICENSE).
