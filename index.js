const pathCommandsDescr = {
  M: "(absolute) (x, y)+ Move the current point to the coordinate x,y.",
  m: "(relative) (dx, dy)+ Move the current point by shifting the last known position of the path by dx along the x-axis and by dy along the y-axis.",
  L: "(absolute) (x, y)+ Draw a line from the current point to the end point specified by x,y.",
  l: "(relative) (dx, dy)+ Draw a line from the current point to the end point, which is the current point shifted by dx along the x-axis and dy along the y-axis.",
  H: "(absolute) (x+) Draw a horizontal line from the current point to the end point, which is specified by the x parameter and the current point's y coordinate.",
  h: "(relative) (dx+) Draw a horizontal line from the current point to the end point, which is specified by the current point shifted by dx along the x-axis and the current point's y coordinate.",
  V: "(absolute) (y+) Draw a vertical line from the current point to the end point, which is specified by the y parameter and the current point's x coordinate.",
  v: "(relative) (dy+) Draw a vertical line from the current point to the end point, which is specified by the current point shifted by dy along the y-axis and the current point's x coordinate.",
  C: "(absolute) (x1,y1, x2,y2, x,y)+ Draw a cubic Bézier curve from the current point to the end point specified by x,y. The start control point is specified by x1,y1 and the end control point is specified by x2,y2.",
  c: "(relative) (dx1,dy1, dx2,dy2, dx,dy)+ Draw a cubic Bézier curve from the current point to the end point, which is the current point shifted by dx along the x-axis and dy along the y-axis. The start control point is the current point (starting point of the curve) shifted by dx1 along the x-axis and dy1 along the y-axis. The end control point is the current point (starting point of the curve) shifted by dx2 along the x-axis and dy2 along the y-axis. ",
  S: "(absolute) (x2,y2, x,y)+ Draw a smooth cubic Bézier curve from the current point to the end point specified by x,y. The end control point is specified by x2,y2. The start control point is a reflection of the end control point of the previous curve command. If the previous command wasn't a cubic Bézier curve, the start control point is the same as the curve starting point (current point).",
  s: "(relative) (dx2,dy2, dx,dy)+ Draw a smooth cubic Bézier curve from the current point to the end point, which is the current point shifted by dx along the x-axis and dy along the y-axis. The end control point is the current point (starting point of the curve) shifted by dx2 along the x-axis and dy2 along the y-axis. The start control point is a reflection of the end control point of the previous curve command. If the previous command wasn't a cubic Bézier curve, the start control point is the same as the curve starting point (current point).",
  Q: "(absolute) (x1,y1, x,y)+ Draw a quadratic Bézier curve from the current point to the end point specified by x,y. The control point is specified by x1,y1.",
  q: "(relative) (dx1,dy1, dx,dy)+ Draw a quadratic Bézier curve from the current point to the end point, which is the current point shifted by dx along the x-axis and dy along the y-axis. The control point is the current point (starting point of the curve) shifted by dx1 along the x-axis and dy1 along the y-axis.",
  T: "(absolute) (x,y)+ Draw a smooth quadratic Bézier curve from the current point to the end point specified by x,y. The control point is a reflection of the control point of the previous curve command. If the previous command wasn't a quadratic Bézier curve, the control point is the same as the curve starting point (current point).",
  t: "(relative) (dx,dy)+ Draw a smooth quadratic Bézier curve from the current point to the end point, which is the current point shifted by dx along the x-axis and dy along the y-axis. The control point is a reflection of the control point of the previous curve command. If the previous command wasn't a quadratic Bézier curve, the control point is the same as the curve starting point (current point).",
  A: "(absolute) (rx ry angle large-arc-flag sweep-flag x y)+ Draw an Arc curve from the current point to the coordinate x,y. The center of the ellipse used to draw the arc is determined automatically based on the other parameters of the command.",
  a: "(relative) (rx ry angle large-arc-flag sweep-flag dx dy)+ Draw an Arc curve from the current point to a point for which coordinates are those of the current point shifted by dx along the x-axis and dy along the y-axis. The center of the ellipse used to draw the arc is determined automatically based on the other parameters of the command.",
  Z: "Close the current subpath by connecting the last point of the path with its initial point. If the two points are at different coordinates, a straight line is drawn between those two points.",
  z: "Close the current subpath by connecting the last point of the path with its initial point. If the two points are at different coordinates, a straight line is drawn between those two points.",
};

function treeHTML(element, object) {
  object["type"] = element.nodeName;
  const nodeList = element.childNodes;
  if (nodeList != null) {
    if (nodeList.length) {
      object["content"] = [];
      for (let i = 0; i < nodeList.length; i++) {
        if (nodeList[i].nodeType !== 3) {
          object["content"].push({});
          treeHTML(
            nodeList[i],
            object["content"][object["content"].length - 1]
          );
        }
      }
    }
  }
  if (element.attributes != null) {
    if (element.attributes.length) {
      object["attributes"] = {};
      for (let i = 0; i < element.attributes.length; i++) {
        object["attributes"][element.attributes[i].nodeName] =
          element.attributes[i].nodeValue;
      }
    }
  }
}

const indentSize = 2;

function parsePathString(path) {
  const result = [];
  let currCommand = { coords: [] };
  let currCoord = 0;
  for (let i = 0; i < path.length; i++) {
    if (/[a-zA-Z]/.test(path[i])) {
      if (i !== 0) {
        result.push(currCommand);
        currCommand = { coords: [] };
        currCoord = 0;
      }
      currCommand.dir = path[i];
    } else if (/[\d\.]/.test(path[i])) {
      currCommand.coords[currCoord] =
        (currCommand.coords[currCoord] || "") + path[i];
    } else if (path[i] === " " || path[i] === ",") {
      currCoord++;
    } else {
      console.error("unexpected symbol in path", path[i]);
    }
  }
  result.push(currCommand);
  return result;
}

function renderAttributes(attributes, indentLevel = 1) {
  return Object.entries(attributes).map(([key, value]) => {
    let string = `<span>${key}="${value}"</span>`;
    if (key === "d") {
      const path = parsePathString(value);
      string = `<span>${key}="${path
        .map((com, i) => {
          const row = `<span data-tooltip="${
            pathCommandsDescr[com.dir]
          }" class="tooltip">${
            com.coords?.length ? com.dir + " " + com.coords.join(" ") : com.dir
          }</span>`;
          return i === 0
            ? row
            : row.padStart(row.length + (indentLevel + 1) * indentSize, " ");
        })
        .join("\n")}"</span>\n`;
    }
    return string.padStart(string.length + indentLevel * indentSize, " ");
  });
}

function renderPrettySvg(element, indentLevel = 0) {
  let tag = element.type;
  return [
    `<span>&lt;${tag}</span>`,
    ...renderAttributes(element.attributes || [], 1),
    "<span>&gt;</span>",
    ...(element.content?.map((el) => renderPrettySvg(el, 1)) || []),
    `<span>&lt;/${tag}&gt;</span>`,
  ]
    .flat()
    .filter((row) => !!row)
    .map((row) => row.padStart(row.length + indentLevel * indentSize, " "));
}

function parseSvg(element) {
  let result = {};

  const parser = new DOMParser();
  const docNode = parser.parseFromString(element, "image/svg+xml");
  treeHTML(docNode.firstChild, result);

  return renderPrettySvg(result).join("\n");
}

const input = document.getElementById("file-upload");
const editor = document.getElementById("editor");
const preview = document.getElementById("preview");

function adjustSvgPreviewSize() {
  const previewSvg = document.querySelector("#preview > svg");
  const contentsHeight = previewSvg.clientHeight;
  const contentsWidth = previewSvg.clientWidth;
  const hostHeight = preview.clientHeight - 40;
  const hostWidth = preview.clientWidth - 40;
  let scale = 1;
  const isBigger = contentsHeight > hostHeight || contentsWidth > hostWidth;
  const isSmaller = contentsHeight < hostHeight && contentsWidth < hostWidth;
  if (isBigger) {
    scale =
      contentsHeight > hostHeight
        ? hostHeight / contentsHeight
        : hostWidth / contentsWidth;
  } else if (isSmaller) {
    scale =
      hostHeight < hostWidth
        ? hostHeight / contentsHeight
        : hostWidth / contentsWidth;
  }
  previewSvg.style.transform = `scale(${scale})`;
  previewSvg.style.transformOrigin = `top left`;
}

input.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    preview.innerHTML = null;
    editor.innerHTML = null;
    const reader = new FileReader();
    reader.readAsText(file, "UTF-8");
    reader.onload = (evt) => {
      preview.innerHTML = evt.target.result;
      editor.innerHTML = parseSvg(evt.target.result);
      adjustSvgPreviewSize();
    };
    reader.onerror = (evt) => {
      preview.innerHTML = "";
      editor.innerText = "error reading file";
    };
  }
});

editor.addEventListener("input", (e) => {
  preview.innerHTML = editor.innerText;
  adjustSvgPreviewSize();
});
