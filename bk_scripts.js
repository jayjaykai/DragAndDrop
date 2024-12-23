// 初始化可拖拉元件區域
const componentList = document.getElementById("component-list");
const canvas = document.getElementById("canvas");

// 初始化可拖拉元件區域，禁止排序
new Sortable(componentList, {
    group: {
        name: 'shared', // 共享分組允許拖拉到其他區域
        pull: 'clone', // 複製元件
        put: false     // 禁止放回元件區域
    },
    sort: true,  // 禁止在 component-list 中調整順序
    animation: 150 // 動畫時長
});

// 初始化畫布
new Sortable(canvas, {
    group: {
        name: 'shared',
        pull: false, // 禁止從畫布中複製
        put: true // 允許放置元件
    },
    animation: 150,
    handle: '.canvas-item', // 限定只能通過 canvas-item 拖動
    draggable: '.canvas-item', // 限制拖動的元素
    onAdd: function (event) {
        const itemType = event.item.getAttribute('data-type');
        const itemName = event.item.textContent.trim();

        // 檢查是否是有效的類型，避免多餘空白元件
        if (!itemType) {
            event.item.remove(); // 移除不必要的空白元素
            return;
        }

        // 添加新元素到畫布
        addElementToCanvas(itemType, itemName, event.target);

        // 移除拖拉後的源元素
        event.item.remove();
    },
    onEnd: function (event) {
        const draggedElement = event.item;
        
        // 如果拖動的元素不在 canvas 內，則刪除
        if (!canvas.contains(draggedElement)) {
            draggedElement.remove();
        }

        // 確保沒有多餘空白節點
        cleanupEmptyNodes(canvas);
    }
});

// 添加元件到畫布
function addElementToCanvas(type, name, target) {
    if (type === 'button') {
        // 檢查畫布是否已經存在獨立的按鈕行
        const row = document.createElement('div');
        row.className = 'canvas-item';
        row.style.display = 'flex';
        row.style.flexDirection = 'column';

        const button = createElement(type, name);
        row.appendChild(button);

        // 將新的行加入到畫布
        canvas.appendChild(row);

        // 為每個新創建的行初始化 Sortable.js，使其可拖放
        new Sortable(row, {
            group: {
                name: 'shared',
                put: function (to, from, item) {
                    // 只允許放置 input 到已有按鈕的行，不允許放置新按鈕
                    // return item.getAttribute('data-type') !== 'button';
                }
            },
            animation: 150,
            onAdd: function (event) {
                const itemType = event.item.getAttribute('data-type');
                const itemName = event.item.textContent.trim();
                const newElement = createElement(itemType, itemName);
                event.item.replaceWith(newElement);
            }
        });
    } else if (type === 'input') {
        // 將 input 元件加入到最近的 row 中（使其可以放在 button 後面）
        const lastRow = canvas.lastElementChild;
        if (lastRow && lastRow.classList.contains('canvas-item')) {
            const input = createElement(type, name);
            lastRow.appendChild(input);
        }
    }
}

// 根據元件類型創建新元素
function createElement(type, name) {
    let element;
    switch (type) {
        case 'button':
            element = document.createElement('button');
            element.textContent = name;
            element.setAttribute('data-type', 'button');
            break;
        case 'input':
            element = document.createElement('input');
            element.type = 'text';
            element.placeholder = name;
            element.setAttribute('data-type', 'input');
            break;
        default:
            return null;
    }
    return element;
}


function cleanupEmptyNodes(target) {
    const nodes = target.querySelectorAll('.canvas-item');
    nodes.forEach(node => {
        if (!node.hasChildNodes() || node.innerHTML.trim() === '') {
            node.remove(); // 移除空白節點
        }
    });
}

document.querySelector(".save").addEventListener("click", function () {
    // 獲取 canvas 區域的內容
    const canvas = document.getElementById("canvas");
    const canvasContent = canvas.innerHTML;

    // 將 HTML 內容轉換為 XML 格式
    const xmlContent = htmlToXml(canvasContent);

    // 將 XML 內容存檔
    downloadXmlFile(xmlContent, "canvas_output.xml");

});

function htmlToXml(htmlContent) {
    // 使用 DOMParser 解析 HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, "text/html");

    // 使用 XMLSerializer 將 HTML 轉為 XML 字串
    const serializer = new XMLSerializer();
    let xmlString = serializer.serializeToString(doc.body);

    // 移除 <body> 標籤，並包裹為合法的 XML 節點
    xmlString = xmlString.replace(/<\/?body>/g, "");

    // // 僅對文字內容進行轉義
    // xmlString = sanitizeXmlContent(xmlString);

    // 替換字符
    xmlString = xmlString
        .replace(/button/g, "action")
        .replace(/input/g, "if");

    // 包裹為唯一根節點
    const formattedXml = `<root>${xmlString}</root>`;

    return formattedXml;
}


function downloadXmlFile(xmlContent, fileName) {
    // 創建 Blob 將 XML 內容轉成文件
    const blob = new Blob([xmlContent], { type: "application/xml" });

    // 建立下載鏈接
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;

    // 模擬點擊以觸發下載
    link.click();

    // 釋放 URL
    URL.revokeObjectURL(link.href);
}
