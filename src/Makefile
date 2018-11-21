params = -c -m

meshspin.min.js: meshspin.js
	uglifyjs $(params) < $< > $@

dist: meshspin.min.js
	mv $< ../dist

clean:
	rm -rf meshspin.min.js
