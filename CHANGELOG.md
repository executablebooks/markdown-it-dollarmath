# Change Log

## v0.3.0 - 2021-11-12

👌 IMPROVE: HTML default tags (#2)

Features:

* Wrapped all content in a div/span
* Removed pass-through options to latex renderer
* This is backward compatible in most cases that use katex
* Added an ID to the element when it is labelled
* Added a `labelRenderer` to `IOptions` which allows you to override the HTML of the label.

Development:

* Added JSON parser to rollup, for importing JSON files as modules
* Added prettier ignore file to ensure `.md` fixtures are never corrected
* Simplified the logic around the renderer using a factory

## v0.2.0 - 2021-07-01

Initial release
