################################
# Builder stage for .NET backend
################################
# nosonar - this is a builder stage
FROM mcr.microsoft.com/dotnet/sdk:9.0-bookworm-slim AS backend-builder
LABEL stage=builder

# Install build dependencies
RUN apt-get update && \
    apt-get --no-install-recommends install -y \
    autoconf \
    automake \
    ca-certificates \
    g++ \
    gcc \
    gifsicle \
    git \
    libpng-dev \
    libtool \
    make \
    musl-dev \
    nasm && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* \
&& groupadd -r builder && useradd -r -g builder builder \
&& mkdir -p /opt/jellyfin /jellyfin && \
    chown -R builder:builder /opt /jellyfin

# Switch to non-root user for the build steps
USER builder

# Clone and build Jellyfin backend
WORKDIR /opt
RUN git clone https://github.com/jellyfin/jellyfin.git --depth 1

WORKDIR /opt/jellyfin
RUN DOTNET_CLI_TELEMETRY_OPTOUT=1 \
    DOTNET_CLI_HOME="/tmp/" \
    dotnet publish Jellyfin.Server \
    --configuration Release \
    --output="/jellyfin" \
    --self-contained \
    -p:DebugSymbols=false \
    -p:DebugType=none

####################################
# Builder stage for Node.js frontend
####################################
FROM node:22-bookworm-slim AS frontend-builder

# Install git for cloning
RUN apt-get update && \
    apt-get --no-install-recommends install -y git && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Clone and build Jellyfin web
WORKDIR /opt

# Copy this repo source inside the container
COPY package*.json /opt/jellyfin-web/
COPY webpack.*.js /opt/jellyfin-web/
COPY tsconfig.json /opt/jellyfin-web/
COPY *.config.js /opt/jellyfin-web/
# nosonar - .dockerignore file excludes sensitive data
COPY src/ /opt/jellyfin-web/src/

# Alternatively, clone a PR or a repo
# RUN git clone https://github.com/jellyfin/jellyfin-web.git --depth 1

WORKDIR /opt/jellyfin-web
RUN npm ci --ignore-scripts && \
    npm run build:production

###########################
# Runtime stage for backend
###########################
FROM mcr.microsoft.com/dotnet/runtime-deps:9.0-bookworm-slim

# Install runtime dependencies
# nosonar - dependency and user options are left separate for easier changes
RUN apt-get update && \
    apt-get --no-install-recommends install -y \
    ca-certificates \
    curl \
    ffmpeg \
    libfontconfig1 \
    libfreetype6 \
    libssl3 \
    net-tools && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* \
&& groupadd --system appgroup && \
    useradd --system --create-home --gid appgroup --uid 1000 appuser \
&& mkdir -p /jellyfin /config /cache && \
    chown -R appuser:appgroup /jellyfin /config /cache

# Copy built application from builder stage
COPY --from=backend-builder /jellyfin /jellyfin
# Copy built frontend from builder stage
COPY --from=frontend-builder /opt/jellyfin-web/dist/ /jellyfin/jellyfin-web

WORKDIR /jellyfin

# Drop privileges
USER appuser

EXPOSE 8096

ENTRYPOINT ["./jellyfin"]
CMD ["--webdir=/jellyfin/jellyfin-web", "--datadir=/config", "--cachedir=/cache"]