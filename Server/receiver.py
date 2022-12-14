import tornado.web
import os
import uuid

class IndexHandler(tornado.web.RequestHandler):
    storage = "static\\Files\\"
    def get(self,arg):
        self.render("index.html")
    def post(self,arg):
        storage = self.storage
        filename = self.request.body.decode("utf-8")
        conectionID = uuid.uuid4()
        os.mkdir(storage+str(conectionID))
        f = open(storage+"\\"+str(conectionID)+"\\"+filename,"ab")
        f.close()
        self.write(str(conectionID))
        return
    def put(self,conectionID):
        storage = self.storage
        conectionID = conectionID
        Content_Range = self.request.headers["Content-Range"]
        next = Content_Range.split(" ")[1].split("-")[0]
        last = Content_Range.split("-")[1].split("/")[0]
        next = int(next)
        last = int(last)
        filename=os.listdir(storage+"\\"+conectionID)[0]
        filedir=storage+"\\"+conectionID+"\\"+filename
        if (last > os.stat(filedir).st_size):
            with open(filedir,"r+b") as f:
                f.seek(next)
                f.write(self.request.body)
            self.write("OK")
        else:
            self.write("OK")


settings = {
"cookie_secret": "__TODO:_GENERATE_YOUR_OWN_RANDOM_VALUE_HERE__",
'template_path': 'templates',
'static_path': 'static',
"xsrf_cookies": False
}

application = tornado.web.Application([(r"/(.*)", IndexHandler)
],
	debug=True,**settings)

print ("Server started.")
if __name__ == "__main__":
    application.listen(8888)
    tornado.ioloop.IOLoop.instance().start()