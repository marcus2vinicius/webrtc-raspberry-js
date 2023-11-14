from aiohttp import web
import os

ROOT = os.path.dirname(__file__)


async def index(request):
    print("index.html requested")
    content = open(os.path.join(ROOT, "index.html"), "r").read()
    return web.Response(content_type="text/html", text=content)


async def javascript(request):
    print("script-server.js requested")
    content = open(os.path.join(ROOT, "script-server.js"), "r").read()
    return web.Response(content_type="application/javascript", text=content)



if __name__ == "__main__":
    app = web.Application()
    app.router.add_get("/", index)
    app.router.add_get("/script-server.js", javascript)
    web.run_app(
        app, access_log=None, host='localhost', port=8081
    )