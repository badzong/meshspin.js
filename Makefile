params = -c -m

meshspin.min.js: meshspin.js
	uglifyjs $(params) < $< > $@

clean:
	rm -rf meshspin.min.js
