FROM jellyfin/jellyfin:10.8.0

RUN npm install

COPY dist/ /jellyfin/jellyfin-web/
