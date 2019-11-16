FROM alpine:latest

RUN apk add --no-cache nghttp2 coreutils bash

COPY nghttpx.conf /etc/nghttpx.conf
COPY start-nghttpx /usr/bin/start-nghttpx
EXPOSE 3000

CMD [ "/usr/bin/start-nghttpx" ]
# CMD [ "nghttpx -f'*,9999' -b'127.0.0.1,9998' " ]
