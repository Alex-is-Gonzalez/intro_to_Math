// ═══════════════════════════════════════════════════════════════
// LEO'S SUPERMARKET — main.js
// All event listeners attached here — no onclick in HTML needed
// ═══════════════════════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", function () {
  // ─────────────────────────────────────────
  // NAV SCROLL
  // ─────────────────────────────────────────
  function navScrollTo(id) {
    var el = document.getElementById(id);
    if (!el) return;
    var top = el.getBoundingClientRect().top + window.pageYOffset - 65;
    window.scrollTo({ top: top, behavior: "smooth" });
  }

  // Wire up nav links  [data-scroll="ch1"] etc.
  document.querySelectorAll("[data-scroll]").forEach(function (el) {
    el.addEventListener("click", function () {
      navScrollTo(el.getAttribute("data-scroll"));
    });
  });

  // ─────────────────────────────────────────
  // CH1 — LEVERS
  // ─────────────────────────────────────────
  function getVal(id) {
    return parseFloat(document.getElementById(id).value);
  }
  function setText(id, v) {
    document.getElementById(id).textContent = v;
  }

  function calcAndUpdate() {
    var p = getVal("sl-price"),
      s = getVal("sl-shelf"),
      a = getVal("sl-ad"),
      i = getVal("sl-inv");
    setText("v-price", "$" + p.toFixed(2));
    setText("v-shelf", s);
    setText("v-ad", "$" + a);
    setText("v-inv", i);

    var D = Math.max(0, 200 * (1 - 0.08 * p) * (s / 50) * (1 + a / 500));
    var revenue = p * D;
    var waste = Math.max(0, (i - D) * 0.3);
    var cost = waste * 1.5 + i * 0.2;
    var profit = revenue - cost;

    var el = document.getElementById("profit-num");
    el.textContent =
      (profit >= 0 ? "+" : "") + "$" + Math.round(profit).toLocaleString();
    el.style.color = profit >= 0 ? "var(--accent4)" : "var(--accent3)";
    setText(
      "profit-info",
      "Revenue $" +
        Math.round(revenue) +
        " − Cost $" +
        Math.round(cost) +
        " | Demand ≈ " +
        Math.round(D) +
        " units",
    );

    var c = document.getElementById("lever-callout");
    if (profit < 0)
      c.innerHTML =
        '⚠️ <strong style="color:var(--accent3)">Negative profit!</strong> Inventory surplus causes too much waste. Lower inventory or reduce price to boost demand.';
    else if (p > 8)
      c.innerHTML =
        "💡 <strong>High price, low demand.</strong> Demand collapsed — this is the inverse relationship ∂D/∂p < 0.";
    else
      c.innerHTML =
        "💡 <strong>Tip:</strong> Try raising price all the way — does profit always go up? Watch demand respond.";
  }

  ["sl-price", "sl-shelf", "sl-ad", "sl-inv"].forEach(function (id) {
    document.getElementById(id).addEventListener("input", calcAndUpdate);
  });
  calcAndUpdate();

  // ─────────────────────────────────────────
  // CH2 — DOMINOES
  // ─────────────────────────────────────────
  var chainStories = [
    '🌾 Leo raises cereal price by <strong style="color:var(--accent)">50¢</strong> — seems like easy extra revenue...',
    '📉 Customers switch to cheaper brands. Demand drops <strong style="color:var(--accent3)">20%</strong>. Shelves stay stocked.',
    "📦 Unsold cereal piles up in the back room. Inventory surplus climbs.",
    "🗑️ Some boxes hit their expiry date before being sold. Waste rises — the hidden cost Leo missed.",
    "💸 Leo writes off expired stock. That is a real cash loss on the balance sheet.",
    '📊 <strong style="color:var(--accent3)">Profit falls</strong> — despite charging more per box! The chain rule predicted this: dπ/dp was negative overall.',
  ];
  var chainIdx = -1,
    chainTmr = null;

  function triggerChain() {
    resetChain();
    chainIdx = 0;
    stepChain();
  }

  function stepChain() {
    if (chainIdx > 5) return;
    var node = document.getElementById("dom-" + chainIdx);
    node.classList.add("hit");
    setTimeout(function () {
      node.classList.add("active");
    }, 350);
    if (chainIdx > 0) {
      var arr = document.getElementById("da-" + (chainIdx - 1));
      if (arr) arr.classList.add("lit");
    }
    document.getElementById("chain-story").innerHTML = chainStories[chainIdx];
    document.getElementById("step-lbl").textContent =
      "Step " + (chainIdx + 1) + " / 6";
    chainIdx++;
    if (chainIdx <= 5) chainTmr = setTimeout(stepChain, 950);
  }

  function resetChain() {
    clearTimeout(chainTmr);
    chainIdx = -1;
    for (var i = 0; i <= 5; i++) {
      var n = document.getElementById("dom-" + i);
      if (n) n.classList.remove("hit", "active");
      var a = document.getElementById("da-" + i);
      if (a) a.classList.remove("lit");
    }
    document.getElementById("chain-story").innerHTML =
      '👆 Click the <strong style="color:var(--accent)">Price</strong> domino or press Trigger to start the reaction...';
    document.getElementById("step-lbl").textContent = "";
  }

  // Domino click listeners
  for (var d = 0; d <= 5; d++) {
    (function (idx) {
      var node = document.getElementById("dom-" + idx);
      if (node) node.addEventListener("click", triggerChain);
    })(d);
  }
  document
    .getElementById("btn-trigger")
    .addEventListener("click", triggerChain);
  document.getElementById("btn-reset").addEventListener("click", resetChain);

  // ─────────────────────────────────────────
  // CH3 — COMPUTATIONAL GRAPH
  // ─────────────────────────────────────────
  var cvs = document.getElementById("compCanvas");
  var ctx2 = cvs.getContext("2d");

  var NODES = [
    { id: "price", label: "Price\n(p)", rx: 0.07, ry: 0.18, type: "input" },
    { id: "shelf", label: "Shelf\n(s)", rx: 0.07, ry: 0.42, type: "input" },
    { id: "ads", label: "Ad\nSpend (a)", rx: 0.07, ry: 0.66, type: "input" },
    { id: "inv", label: "Inventory\n(i)", rx: 0.07, ry: 0.88, type: "input" },
    { id: "demand", label: "Demand\nD", rx: 0.35, ry: 0.32, type: "mid" },
    { id: "rev", label: "Revenue\nR=p·D", rx: 0.58, ry: 0.15, type: "mid" },
    { id: "waste", label: "Waste\nW", rx: 0.58, ry: 0.58, type: "mid" },
    { id: "cost", label: "Cost\nC(W)", rx: 0.78, ry: 0.5, type: "mid" },
    { id: "profit", label: "Profit\nπ", rx: 0.93, ry: 0.33, type: "output" },
  ];

  var EDGES = [
    { f: "price", t: "demand" },
    { f: "shelf", t: "demand" },
    { f: "ads", t: "demand" },
    { f: "demand", t: "rev" },
    { f: "price", t: "rev" },
    { f: "inv", t: "waste" },
    { f: "demand", t: "waste" },
    { f: "waste", t: "cost" },
    { f: "rev", t: "profit" },
    { f: "cost", t: "profit" },
  ];

  var NODE_COLORS = { input: "#f5c842", mid: "#42c8f5", output: "#42f587" };
  var hlPath = null,
    gradMode = false;

  function nodeXY(n) {
    return { x: n.rx * cvs.width, y: n.ry * cvs.height };
  }
  function findNode(id) {
    for (var i = 0; i < NODES.length; i++)
      if (NODES[i].id === id) return NODES[i];
    return null;
  }

  function drawArrow(x1, y1, x2, y2, col, isGrad) {
    var ang = Math.atan2(y2 - y1, x2 - x1),
      r = 32;
    var sx = x1 + Math.cos(ang) * r,
      sy = y1 + Math.sin(ang) * r;
    var ex = x2 - Math.cos(ang) * r,
      ey = y2 - Math.sin(ang) * r;
    ctx2.save();
    ctx2.strokeStyle = col;
    ctx2.lineWidth = isGrad ? 2.5 : 1.5;
    ctx2.globalAlpha = isGrad ? 0.9 : 0.55;
    ctx2.beginPath();
    if (gradMode && isGrad) {
      ctx2.moveTo(ex, ey);
      ctx2.lineTo(sx, sy);
    } else {
      ctx2.moveTo(sx, sy);
      ctx2.lineTo(ex, ey);
    }
    ctx2.stroke();
    var tx = gradMode && isGrad ? sx : ex;
    var ty = gradMode && isGrad ? sy : ey;
    var ta = gradMode && isGrad ? ang + Math.PI : ang;
    ctx2.fillStyle = col;
    ctx2.globalAlpha = 1;
    ctx2.beginPath();
    ctx2.moveTo(tx + Math.cos(ta) * 9, ty + Math.sin(ta) * 9);
    ctx2.lineTo(tx + Math.cos(ta + 2.6) * 5, ty + Math.sin(ta + 2.6) * 5);
    ctx2.lineTo(tx + Math.cos(ta - 2.6) * 5, ty + Math.sin(ta - 2.6) * 5);
    ctx2.closePath();
    ctx2.fill();
    ctx2.restore();
  }

  function drawGraph() {
    ctx2.clearRect(0, 0, cvs.width, cvs.height);
    EDGES.forEach(function (e) {
      var n1 = findNode(e.f),
        n2 = findNode(e.t);
      if (!n1 || !n2) return;
      var p1 = nodeXY(n1),
        p2 = nodeXY(n2);
      var inPath =
        hlPath && hlPath.indexOf(e.f) > -1 && hlPath.indexOf(e.t) > -1;
      var col = gradMode ? "#f55a42" : inPath ? "#f5c842" : "#2a3045";
      drawArrow(p1.x, p1.y, p2.x, p2.y, col, gradMode);
    });
    NODES.forEach(function (n) {
      var p = nodeXY(n),
        r = 30;
      var inPath = hlPath && hlPath.indexOf(n.id) > -1;
      var nc = NODE_COLORS[n.type];
      ctx2.save();
      if (inPath || gradMode) {
        ctx2.shadowColor = gradMode ? "#f55a42" : nc;
        ctx2.shadowBlur = 18;
      }
      ctx2.beginPath();
      ctx2.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx2.fillStyle = inPath
        ? nc + "28"
        : gradMode
          ? "rgba(245,90,66,0.1)"
          : "#1e2330";
      ctx2.fill();
      ctx2.strokeStyle = gradMode ? "#f55a42" : inPath ? nc : "#2a3045";
      ctx2.lineWidth = inPath || gradMode ? 2 : 1.5;
      ctx2.stroke();
      ctx2.restore();
      ctx2.fillStyle = gradMode ? "#f55a42" : inPath ? nc : "#6b7494";
      ctx2.font = "500 10px monospace";
      ctx2.textAlign = "center";
      var lines = n.label.split("\n");
      lines.forEach(function (l, i) {
        ctx2.fillText(l, p.x, p.y + (i - (lines.length - 1) / 2) * 13 + 4);
      });
    });
  }

  function resizeCanvas() {
    var w = cvs.parentElement.clientWidth || 600;
    cvs.width = Math.min(w, 900);
    cvs.height = 400;
    drawGraph();
  }

  function forwardPath(id) {
    var visited = [];
    function walk(nid) {
      if (visited.indexOf(nid) > -1) return;
      visited.push(nid);
      EDGES.forEach(function (e) {
        if (e.f === nid) walk(e.t);
      });
    }
    walk(id);
    return visited;
  }

  function runForward() {
    gradMode = false;
    hlPath = [];
    var seq = [
      "price",
      "shelf",
      "ads",
      "inv",
      "demand",
      "rev",
      "waste",
      "cost",
      "profit",
    ];
    var i = 0;
    function step() {
      hlPath = seq.slice(0, i + 1);
      drawGraph();
      i++;
      if (i < seq.length) setTimeout(step, 260);
    }
    step();
  }

  function runBackward() {
    hlPath = null;
    gradMode = true;
    drawGraph();
    setTimeout(function () {
      gradMode = false;
      drawGraph();
    }, 3000);
  }

  cvs.addEventListener("click", function (e) {
    var rect = cvs.getBoundingClientRect();
    var scaleX = cvs.width / rect.width;
    var scaleY = cvs.height / rect.height;
    var mx = (e.clientX - rect.left) * scaleX;
    var my = (e.clientY - rect.top) * scaleY;
    var hit = null;
    NODES.forEach(function (n) {
      var p = nodeXY(n);
      if (Math.hypot(mx - p.x, my - p.y) < 30) hit = n;
    });
    if (hit) {
      gradMode = false;
      hlPath = forwardPath(hit.id);
      drawGraph();
    }
  });

  document.getElementById("btn-forward").addEventListener("click", runForward);
  document
    .getElementById("btn-backward")
    .addEventListener("click", runBackward);

  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // ─────────────────────────────────────────
  // CH4 — MATRIX DOT PRODUCT
  // ─────────────────────────────────────────
  var mPrices = [3, 2, 4, 5];
  var mDemands = [100, 200, 150, 80];

  function updateMatrix(idx, type, val) {
    val = parseFloat(val) || 0;
    if (type === "p") {
      mPrices[idx] = val;
      document.getElementById("mp" + idx).textContent = val;
      document.getElementById("ml-p" + idx).textContent = "$" + val;
      document.getElementById("sp" + idx).textContent = val;
    } else {
      mDemands[idx] = val;
      document.getElementById("md" + idx).textContent = val;
      document.getElementById("ml-d" + idx).textContent = val;
      document.getElementById("sd" + idx).textContent = val;
    }
    for (var i = 0; i < 4; i++)
      document.getElementById("sr" + i).textContent = (
        mPrices[i] * mDemands[i]
      ).toLocaleString();
    var total = mPrices.reduce(function (s, p, i) {
      return s + p * mDemands[i];
    }, 0);
    document.getElementById("sr-total").textContent = total.toLocaleString();
    document.getElementById("dot-result").textContent =
      "$" + total.toLocaleString();
  }

  // Wire up matrix sliders via data attributes
  document.querySelectorAll("[data-matrix-idx]").forEach(function (input) {
    input.addEventListener("input", function () {
      updateMatrix(
        parseInt(input.getAttribute("data-matrix-idx")),
        input.getAttribute("data-matrix-type"),
        input.value,
      );
    });
  });

  function animateDot() {
    for (var i = 0; i < 4; i++) {
      document.getElementById("ds" + i).classList.remove("show");
      document.getElementById("mp" + i).className = "mcell";
      document.getElementById("md" + i).className = "mcell";
    }
    document.getElementById("ds-total").classList.remove("show");
    var step = 0;
    function go() {
      if (step < 4) {
        if (step > 0) {
          document.getElementById("mp" + (step - 1)).className = "mcell done";
          document.getElementById("md" + (step - 1)).className = "mcell done";
        }
        document.getElementById("mp" + step).className = "mcell hl";
        document.getElementById("md" + step).className = "mcell hl";
        document.getElementById("ds" + step).classList.add("show");
        step++;
        setTimeout(go, 700);
      } else {
        for (var j = 0; j < 4; j++) {
          document.getElementById("mp" + j).className = "mcell done";
          document.getElementById("md" + j).className = "mcell done";
        }
        document.getElementById("ds-total").classList.add("show");
        setTimeout(function () {
          for (var j = 0; j < 4; j++) {
            document.getElementById("mp" + j).className = "mcell";
            document.getElementById("md" + j).className = "mcell";
          }
        }, 2200);
      }
    }
    go();
  }

  document
    .getElementById("btn-animate-dot")
    .addEventListener("click", animateDot);

  // ─────────────────────────────────────────
  // CH5 — QUIZ
  // ─────────────────────────────────────────
  var QS = [
    {
      ch: "CH1 · Multivariable",
      q: "Leo's profit function is written as π(p, s, a, i). What does this notation mean?",
      opts: [
        "Profit depends only on price p",
        "Profit is a multivariable function of price, shelf space, ads, and inventory",
        "Profit is multiplied by four separate constants",
        "The letters p, s, a, i are all equal to each other",
      ],
      ans: 1,
      exp: "π(p, s, a, i) means profit is a function of four independent input variables simultaneously — that is the definition of a multivariable function.",
    },
    {
      ch: "CH1 · Multivariable",
      q: "Leo doubles his advertising spend but demand barely changes. Which concept explains this?",
      opts: [
        "∂D/∂a can be close to zero — the partial derivative is small",
        "Advertising and demand are completely unrelated variables",
        "The chain rule always produces negative results",
        "A dot product of zero means no relationship",
      ],
      ans: 0,
      exp: "A partial derivative ∂D/∂a measures sensitivity of demand to advertising. If it is near zero, doubling spend moves demand very little — the lever has low marginal impact.",
    },
    {
      ch: "CH1 · Multivariable",
      q: "Why can't Leo fully analyse his store using single-variable calculus?",
      opts: [
        "Single-variable calculus has no derivatives",
        "His store has no mathematical structure",
        "Changing price also changes demand, waste, and cost simultaneously — variables are coupled",
        "Single-variable calculus only works for geometry",
      ],
      ans: 2,
      exp: "Single-variable calculus isolates one input at a time. Leo's store is a coupled system — every lever affects multiple outputs — requiring partial derivatives and multivariable analysis.",
    },
    {
      ch: "CH2 · Chain Rule",
      q: "Price → Demand → Inventory → Waste → Cost → Profit. What mathematical rule describes this cascade?",
      opts: [
        "Product Rule",
        "Quotient Rule",
        "Chain Rule",
        "Integration by Parts",
      ],
      ans: 2,
      exp: "The Chain Rule computes the derivative of a composition: dπ/dp = (dπ/dC)·(dC/dW)·(dW/dI)·(dI/dD)·(dD/dp). Each arrow is one factor.",
    },
    {
      ch: "CH2 · Chain Rule",
      q: "Leo raises cereal price. What type of relationship exists between Price and Demand?",
      opts: [
        "Direct — higher price means higher demand",
        "Inverse — higher price means lower demand",
        "No relationship — they are independent",
        "Quadratic — demand first rises then falls",
      ],
      ans: 1,
      exp: "Price and demand have an inverse relationship: ∂D/∂p < 0. As price rises, customers switch to cheaper alternatives and demand falls.",
    },
    {
      ch: "CH2 · Chain Rule",
      q: "Leo raised price by 50¢ hoping for more revenue — but profit fell. Which chain rule insight explains this?",
      opts: [
        "dπ/dp can be negative even when dp is positive, if downstream effects outweigh the revenue gain",
        "Revenue always falls when price rises",
        "The chain rule only applies to neural networks",
        "Waste and inventory are unrelated to profit",
      ],
      ans: 0,
      exp: "The full derivative dπ/dp multiplies every chain link. Lower demand → higher surplus → more waste → higher write-offs can dominate, making dπ/dp negative overall.",
    },
    {
      ch: "CH3 · Comp. Graph",
      q: "In a computational graph, what does the backward pass (backpropagation) compute?",
      opts: [
        "The final profit value from inputs",
        "Gradients — how much each input contributed to the output",
        "A list of all products sorted by revenue",
        "The matrix dot product of prices and demands",
      ],
      ans: 1,
      exp: "The backward pass flows gradients from output back to inputs. Each gradient ∂π/∂x tells Leo — and neural networks — how much changing input x would shift the output.",
    },
    {
      ch: "CH3 · Comp. Graph",
      q: "In Leo's graph, which node type represents things Leo directly controls?",
      opts: [
        "Output nodes (profit, satisfaction)",
        "Intermediate nodes (demand, waste, revenue)",
        "Input nodes (price, shelf space, advertising, inventory)",
        "Edge nodes (the arrows)",
      ],
      ans: 2,
      exp: "Input nodes are independent variables Leo sets directly. Intermediate nodes are computed from inputs; output nodes are the final quantities to optimise.",
    },
    {
      ch: "CH3 · Comp. Graph",
      q: "Shelf Space points to Demand, but Demand indirectly affects Shelf Space allocation. What does this create?",
      opts: [
        "A dead-end branch with no meaning",
        "A feedback loop — making the graph cyclic",
        "A dot product operation",
        "A partial derivative that is always zero",
      ],
      ans: 1,
      exp: "A loop (cycle) in a computational graph means feedback — demand influences shelf space allocation, which influences future demand. Cyclic graphs require special handling like recurrent neural networks.",
    },
    {
      ch: "CH4 · Matrices",
      q: "P = [3, 2, 4, 5] and D = [100, 200, 150, 80]. What is the total revenue P · D?",
      opts: ["$1,500", "$1,700", "$2,100", "$1,300"],
      ans: 1,
      exp: "Dot product: (3×100)+(2×200)+(4×150)+(5×80) = 300+400+600+400 = $1,700. Each matching pair is multiplied and results are summed.",
    },
    {
      ch: "CH4 · Matrices",
      q: "Why is the dot product P · D more efficient than calculating each product's revenue separately?",
      opts: [
        "It is not — individual calculations are always faster",
        "A single vectorised operation handles all products simultaneously and scales to any number of products",
        "Dot products always produce larger numbers",
        "The dot product avoids multiplication",
      ],
      ans: 1,
      exp: "Vector operations batch-process all products at once. Whether Leo stocks 4 or 4,000 products, P·D computes total revenue with the same expression.",
    },
    {
      ch: "CH4 · Matrices",
      q: "Leo doubles every price in vector P. Without recalculating, what happens to total revenue P · D?",
      opts: [
        "Revenue stays the same — D did not change",
        "Revenue doubles — scalar multiplication distributes: (2P)·D = 2(P·D)",
        "Revenue quadruples",
        "Revenue becomes undefined",
      ],
      ans: 1,
      exp: "Scalar multiplication distributes over a dot product: (2P)·D = 2(P·D). Doubling every price doubles total revenue if demand stays fixed — a key property of linearity.",
    },
  ];

  var qIdx = 0,
    userAns = [],
    didAnswer = false;

  function showQPanel(id) {
    ["quiz-start", "quiz-question", "quiz-results"].forEach(function (p) {
      document.getElementById(p).style.display = p === id ? "block" : "none";
    });
  }

  function startQuiz() {
    qIdx = 0;
    userAns = [];
    didAnswer = false;
    showQPanel("quiz-question");
    renderQ();
  }

  function renderQ() {
    didAnswer = false;
    var q = QS[qIdx],
      total = QS.length;
    document.getElementById("qprog").style.width = (qIdx / total) * 100 + "%";
    document.getElementById("qtag").textContent = q.ch;
    document.getElementById("qcount").textContent =
      "Question " + (qIdx + 1) + " of " + total;
    document.getElementById("qtext").textContent = q.q;
    var keys = ["A", "B", "C", "D"];
    var optsEl = document.getElementById("qopts");
    optsEl.innerHTML = "";
    q.opts.forEach(function (opt, i) {
      var b = document.createElement("button");
      b.className = "qopt";
      b.innerHTML =
        '<span class="okey">' + keys[i] + "</span><span>" + opt + "</span>";
      b.addEventListener(
        "click",
        (function (ii) {
          return function () {
            selectAns(ii);
          };
        })(i),
      );
      optsEl.appendChild(b);
    });
    document.getElementById("qfb").style.display = "none";
    document.getElementById("qnext").style.display = "none";
  }

  function selectAns(idx) {
    if (didAnswer) return;
    didAnswer = true;
    var q = QS[qIdx],
      correct = idx === q.ans;
    userAns.push({ chosen: idx, correct: correct });
    var btns = document.querySelectorAll(".qopt");
    btns.forEach(function (b, i) {
      b.disabled = true;
      if (i === q.ans) b.classList.add(correct ? "correct" : "show-correct");
      if (i === idx && !correct) b.classList.add("wrong");
    });
    var fb = document.getElementById("qfb");
    fb.style.display = "block";
    fb.className = "qfb " + (correct ? "cfb" : "wfb");
    fb.innerHTML =
      (correct
        ? "✅ <strong>Correct!</strong> "
        : "❌ <strong>Not quite.</strong> ") + q.exp;
    var nb = document.getElementById("qnext");
    nb.style.display = "inline-block";
    nb.textContent = qIdx < QS.length - 1 ? "Next →" : "See Results →";
  }

  function nextQ() {
    qIdx++;
    if (qIdx < QS.length) renderQ();
    else showResults();
  }

  function showResults() {
    showQPanel("quiz-results");
    var total = QS.length;
    var score = userAns.filter(function (a) {
      return a.correct;
    }).length;
    var pct = Math.round((score / total) * 100);
    var arc = document.getElementById("ring-arc");
    var pass = pct >= 80;
    arc.style.stroke = pass
      ? "var(--accent4)"
      : pct >= 50
        ? "var(--accent)"
        : "var(--accent3)";
    setTimeout(function () {
      arc.style.strokeDashoffset = 326.7 - (pct / 100) * 326.7;
    }, 80);
    document.getElementById("rpct").textContent = pct + "%";
    document.getElementById("rpct").style.color = pass
      ? "var(--accent4)"
      : pct >= 50
        ? "var(--accent)"
        : "var(--accent3)";
    var grade = "F";
    if (pct >= 90) grade = "A";
    else if (pct >= 80) grade = "B";
    else if (pct >= 70) grade = "C";
    else if (pct >= 60) grade = "D";
    document.getElementById("rgrade").textContent = "GRADE " + grade;
    var titles = [
      [
        90,
        "🏆 Store Manager Certified!",
        "You nailed " +
          score +
          " of " +
          total +
          ". Leo would trust you with the keys.",
      ],
      [
        80,
        "🎉 Great Work!",
        score + "/" + total + " correct. Solid grip on the math.",
      ],
      [
        60,
        "📚 Almost There",
        score + "/" + total + " correct. A few concepts need another pass.",
      ],
      [
        0,
        "🔄 Keep Practising",
        score +
          "/" +
          total +
          " correct. Revisit the interactive sections and try again!",
      ],
    ];
    var found = null;
    for (var i = 0; i < titles.length; i++) {
      if (pct >= titles[i][0]) {
        found = titles[i];
        break;
      }
    }
    document.getElementById("res-h").textContent = found[1];
    document.getElementById("res-sub").textContent = found[2];
    document.getElementById("dl-zone").style.display = pass ? "block" : "none";
    document.getElementById("nudge-zone").style.display = pass
      ? "none"
      : "block";
    if (!pass) {
      var need = 80 - pct;
      var moreQ = Math.ceil(need / (100 / total));
      document.getElementById("nudge-zone").innerHTML =
        "📊 Your score: <strong>" +
        pct +
        "%</strong> &nbsp;|&nbsp; You need <strong>" +
        need +
        " more percentage point" +
        (need === 1 ? "" : "s") +
        "</strong> to unlock the answer sheet.<br>" +
        "That is just " +
        moreQ +
        " more correct answer" +
        (moreQ === 1 ? "" : "s") +
        ". You've got this — hit Retake!";
    }
    var chapters = {};
    QS.forEach(function (q, i) {
      var k = q.ch.split("·")[1].trim();
      if (!chapters[k]) chapters[k] = { c: 0, t: 0 };
      chapters[k].t++;
      if (userAns[i] && userAns[i].correct) chapters[k].c++;
    });
    var bd = document.getElementById("breakdown");
    bd.innerHTML = "";
    Object.keys(chapters).forEach(function (name) {
      var d = chapters[name];
      var bp = Math.round((d.c / d.t) * 100);
      var cls = bp === 100 ? "bc" : bp >= 50 ? "bp" : "bw";
      bd.innerHTML +=
        '<div class="bitem"><div class="btopic">' +
        name +
        '</div><div class="bscore ' +
        cls +
        '">' +
        d.c +
        "/" +
        d.t +
        " correct (" +
        bp +
        "%)</div></div>";
    });
  }

  function downloadCSV() {
    var total = QS.length;
    var score = userAns.filter(function (a) {
      return a.correct;
    }).length;
    var pct = Math.round((score / total) * 100);
    var grade = "F";
    if (pct >= 90) grade = "A";
    else if (pct >= 80) grade = "B";
    else if (pct >= 70) grade = "C";
    else if (pct >= 60) grade = "D";
    var now = new Date();
    var esc = function (s) {
      return '"' + String(s).replace(/"/g, '""') + '"';
    };
    var csv = "LEO'S SUPERMARKET - QUIZ RESULTS\n";
    csv +=
      "Date," +
      esc(
        now.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      ) +
      "\n";
    csv += "Score," + esc(score + " / " + total) + "\n";
    csv += "Percentage," + esc(pct + "%") + "\n";
    csv += "Grade," + esc(grade) + "\n";
    csv += "Status," + esc(pct >= 80 ? "PASS" : "FAIL") + "\n\n";
    csv +=
      [
        "#",
        "Chapter",
        "Question",
        "Your Answer",
        "Correct Answer",
        "Result",
        "Explanation",
      ]
        .map(esc)
        .join(",") + "\n";
    var keys = ["A", "B", "C", "D"];
    QS.forEach(function (q, i) {
      var ua = userAns[i];
      csv +=
        [
          i + 1,
          q.ch,
          q.q,
          ua ? keys[ua.chosen] + ". " + q.opts[ua.chosen] : "No answer",
          keys[q.ans] + ". " + q.opts[q.ans],
          ua && ua.correct ? "CORRECT" : "WRONG",
          q.exp,
        ]
          .map(esc)
          .join(",") + "\n";
    });
    var blob = new Blob([csv], { type: "text/csv" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "leo-supermarket-quiz-results.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Wire up quiz buttons
  document
    .getElementById("btn-start-quiz")
    .addEventListener("click", startQuiz);
  document.getElementById("btn-retake").addEventListener("click", startQuiz);
  document
    .getElementById("btn-close-quiz")
    .addEventListener("click", function () {
      showQPanel("quiz-start");
    });
  document
    .getElementById("btn-download")
    .addEventListener("click", downloadCSV);
  document.getElementById("qnext").addEventListener("click", nextQ);
}); // end DOMContentLoaded
