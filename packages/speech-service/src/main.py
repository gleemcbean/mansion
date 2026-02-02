from aiohttp import web
from aiohttp_middlewares import cors_middleware
from constants.config import RTC_PORT
from utils.rtc import offer, close

if __name__ == "__main__":
  app = web.Application()
  app.on_shutdown.append(close)
  app.router.add_post("/offer", offer)

  app.middlewares.append(cors_middleware(allow_all=True))

  web.run_app(app, host="0.0.0.0", port=RTC_PORT)