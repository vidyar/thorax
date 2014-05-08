test:
	mkdir -p shippable/testresults && XUNIT_FILE=shippable/testresults/result.xml ./node_modules/mocha/bin/_mocha --timeout 5000 --reporter=xunit-file test/*.js

.PHONY: test
