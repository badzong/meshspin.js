params = -c -m
objects = meshspin.es6.js meshspin.js meshspin.min.js
dist = $(objects) index.html index.ts tsconfig.json

all: $(objects)

meshspin.es6.js: meshspin.es6.js.m4 meshspin.js.in
	m4 $< > $@

meshspin.js: meshspin.js.m4 meshspin.js.in
	m4 $< > $@

meshspin.min.js: meshspin.js
	uglifyjs $(params) < $< > $@

dist: $(objects)
	rm -rf ../dist/*
	cp $(dist) ../dist

clean:
	rm -rf $(objects)
