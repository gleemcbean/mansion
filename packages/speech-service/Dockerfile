FROM python:3

WORKDIR /app/packages/speech-service

COPY packages/speech-service/ ./

RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 4001

CMD [ "python", "src/main.py" ]