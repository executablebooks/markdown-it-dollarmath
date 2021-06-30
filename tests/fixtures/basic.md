single dollar
.
$
.
<p>$</p>
.

double-dollar
.
$$
.
<p>$$</p>
.

single character inline equation. (valid=True)
.
$a$
.
<p><eq>a</eq></p>
.

inline equation with single greek character (valid=True)
.
$\\varphi$
.
<p><eq>\\varphi</eq></p>
.

simple equation starting and ending with numbers. (valid=True)
.
$1+1=2$
.
<p><eq>1+1=2</eq></p>
.

simple equation including special html character. (valid=True)
.
$1+1<3$
.
<p><eq>1+1<3</eq></p>
.

equation including backslashes. (valid=True)
.
$a \\backslash$
.
<p><eq>a \\backslash</eq></p>
.

use of currency symbol, i.e. digits before/after opening/closing (valid=True)
.
3$1+2$ $1+2$3
.
<p>3$1+2$ $1+2$3</p>
.

use of currency symbol (valid=True)
.
If you solve $1+2$ you get $3
.
<p>If you solve <eq>1+2</eq> you get $3</p>
.

inline fraction (valid=True)
.
$\\frac{1}{2}$
.
<p><eq>\\frac{1}{2}</eq></p>
.

inline column vector (valid=True)
.
$\\begin{pmatrix}x\\\\y\\end{pmatrix}$
.
<p><eq>\\begin{pmatrix}x\\\\y\\end{pmatrix}</eq></p>
.

inline bold vector notation (valid=True)
.
${\\tilde\\bold e}_\\alpha$
.
<p><eq>{\\tilde\\bold e}_\\alpha</eq></p>
.

exponentiation (valid=True)
.
$a^{b}$
.
<p><eq>a^{b}</eq></p>
.

conjugate complex (valid=True)
.
$a^\*b$ with $a^\*$
.
<p><eq>a^\*b</eq> with <eq>a^\*</eq></p>
.

Inline multi-line (valid=True)
.
a $a
\not=1$ b
.
<p>a <eq>a
\not=1</eq> b</p>
.

Inline multi-line with newline (valid=False)
.
a $a

\not=1$ b
.
<p>a $a</p>
<p>\not=1$ b</p>
.
