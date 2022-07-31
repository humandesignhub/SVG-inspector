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
          const row = com.coords?.length
            ? com.dir + " " + com.coords.join(" ")
            : com.dir;
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
    ...renderAttributes(element.attributes, 1),
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
  const hostHeight = preview.clientHeight - 20;
  const hostWidth = preview.clientWidth - 20;
  let scale = 1;
  const isBigger = contentsHeight > hostHeight || contentsWidth > hostWidth;
  const isSmaller = contentsHeight < hostHeight && contentsWidth < hostWidth;
  if (isBigger) {
    if (contentsHeight > hostHeight) {
      scale =
        contentsHeight > hostHeight
          ? hostHeight / contentsHeight
          : hostWidth / contentsWidth;
    }
  } else if (isSmaller) {
    scale = hostWidth / contentsWidth;
  }
  previewSvg.style.transform = `scale(${scale})`;
  previewSvg.style.transformOrigin = `top left`;
}

input.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
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
