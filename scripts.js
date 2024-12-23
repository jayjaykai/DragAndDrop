// 初始化可拖拉元件區域
const componentList = document.getElementById("component-list");
const canvas = document.getElementById("canvas");

new Sortable(componentList, {
    group: {
        name: 'shared',
        pull: 'clone',
        put: false
    },
    sort: false,
    animation: 500
});

initializeSortable(canvas);

function initializeSortable(target) {
    new Sortable(target, {
        group: {
            name: 'shared',
            pull: true,
            put: true
        },
        animation: 500,
        swapThreshold: 0.65,
        invertSwap: true,
        handle: '.canvas-item',
        draggable: '.canvas-item',
        onAdd: function (event) {
            if (event.from === componentList) {
                const itemType = event.item.getAttribute('data-type');
                const itemName = event.item.textContent.trim();

                const newElement = addElementToCanvas(itemType, itemName);
                event.item.replaceWith(newElement);

                if (itemType === 'button') {
                    initializeSortable(newElement.querySelector(".nested"));
                }
            }
            updateHeaderColors(canvas);
        },
    });
}
// 允許拖拉元件放置到畫布區域外，不顯示禁止符號
document.addEventListener('dragover', function(event) {
    event.preventDefault();
});

// 記錄拖拉元件
let draggedElement = null;
let isDraggingOutside = false;

canvas.addEventListener('dragstart', function(event) {
    draggedElement = event.target; // 記錄正在拖拉的元件
    console.log('Drag started:', draggedElement);
});

document.addEventListener('dragleave', function(event) {
    // 檢查鼠標位置是否超出畫布
    const canvasRect = canvas.getBoundingClientRect();
    const isOutside = 
        event.clientY < canvasRect.top || 
        event.clientY > canvasRect.bottom;

    if (isOutside) {
        isDraggingOutside = true;
    }
    else{
        isDraggingOutside = false;
    }
});

document.addEventListener('drop', function(event) {
    event.preventDefault(); // 阻止瀏覽器處理拖拉元件，確保自訂刪除操作可以執行
    if (isDraggingOutside && draggedElement) {
        const userConfirmed = confirm("是否要刪除此元件？");
        if (userConfirmed) {
            draggedElement.remove();
        }
        isDraggingOutside = false;
    }
    draggedElement = null;
    isDraggingOutside = false;
});

// 添加元件到畫布
function addElementToCanvas(type, name) {
    if (type === 'button') {
        const container = document.createElement('div');
        container.className = 'canvas-item';
    
        const header = document.createElement('div');
        header.textContent = name;
        header.className = 'canvas-header';
        container.appendChild(header);
    
        const nestedArea = document.createElement('div');
        nestedArea.className = 'nested';
        container.appendChild(nestedArea);
        canvas.appendChild(container);

        addToggleButton(container, header);
        
        // 更新背景色
        updateHeaderColors(canvas);
    
        return container;
    }
    else if (type === 'input') {
        const inputElement = document.createElement('input');
        inputElement.type = 'text';
        inputElement.placeholder = name;
        inputElement.setAttribute('data-type', 'input');
        inputElement.className = 'canvas-input';

        const container = document.createElement('div');
        container.className = 'canvas-item';
        container.appendChild(inputElement);

        return container;
    }
    return null;
}

// 添加縮放按鈕
function addToggleButton(container, header) {
    const toggleBtn = document.createElement('button');
    toggleBtn.classList.add('toggle-btn');
    toggleBtn.textContent = "🔽"; // 初始顯示展開箭頭

    header.appendChild(toggleBtn);

    toggleBtn.addEventListener('click', function() {
        const nestedContent = container.querySelector('.nested');
        nestedContent.classList.toggle('hidden');
        toggleBtn.textContent = nestedContent.classList.contains('hidden') ? "▶" : "🔽";
    });
}

function setHeaderBackgroundColor(headerElement, level = 0) {
    const maxDepth = 3;
    const baseGray = 240;
    const minGray = 50;
    const depthFactor = Math.floor((baseGray - minGray) / maxDepth);

    let grayValue = baseGray - level * depthFactor;
    grayValue = Math.max(minGray, Math.min(baseGray, grayValue));

    headerElement.style.backgroundColor = `rgb(${grayValue}, ${grayValue}, ${grayValue})`;
}

function updateHeaderColors(target) {
    const headers = target.querySelectorAll('.canvas-header');
    headers.forEach(header => {
        let depth = 0;
        let parent = header.closest('.canvas-item');
        while (parent && parent.parentElement.closest('.nested')) {
            depth++;
            parent = parent.parentElement.closest('.canvas-item');
        }
        setHeaderBackgroundColor(header, depth);
    });
}

document.querySelector(".save").addEventListener("click", function () {
    const canvas = document.getElementById("canvas");
    // 將 canvas 的 HTML 內容轉為 XML，包含 input 的值，但不修改原始 DOM
    const xmlContent = htmlToXml(canvas);
    downloadXmlFile(xmlContent, "canvas_output.xml");
});

function htmlToXml(canvas) {
    // 複製 canvas 的內容
    const clonedCanvas = canvas.cloneNode(true);

    // 確保 input 的值寫回到其屬性
    const inputs = clonedCanvas.querySelectorAll("input");
    inputs.forEach(input => {
        input.setAttribute("value", input.value); // 只修改複製的 DOM 節點
    });

    // 替換 button 為 action
    const buttons = clonedCanvas.querySelectorAll("button");
    buttons.forEach(button => {
        const action = document.createElement("action");
        action.innerHTML = button.innerHTML;
        button.parentNode.replaceChild(action, button); // 只修改複製的 DOM 節點
    });

    // 序列化 DOM 節點為 XML 字串
    const serializer = new XMLSerializer();
    let xmlString = serializer.serializeToString(clonedCanvas);

    // 刪除 xmlns
    xmlString = xmlString.replace(/ xmlns="[^"]*"/g, "");

    // 包裹為唯一根節點
    return `<TestFlow>${xmlString}</TestFlow>`;
}

function downloadXmlFile(content, filename) {
    const blob = new Blob([content], { type: "application/xml" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


// // 儲存按鈕事件
// document.querySelector(".save").addEventListener("click", function () {
//     const canvas = document.getElementById("canvas");
//     const canvasContent = canvas.innerHTML;
//     const xmlContent = htmlToXml(canvasContent);
//     downloadXmlFile(xmlContent, "canvas_output.xml");
// });

// function htmlToXml(htmlContent) {
//     // 使用 DOMParser 解析 HTML
//     const parser = new DOMParser();
//     const doc = parser.parseFromString(htmlContent, "text/html");

//     // 使用 XMLSerializer 將 HTML 轉為 XML 字串
//     const serializer = new XMLSerializer();
//     let xmlString = serializer.serializeToString(doc.body);

//     // 移除 <body> 標籤，並包裹為合法的 XML 節點
//     xmlString = xmlString.replace(/<\/?body>/g, "");

//     // 替換字符
//     xmlString = xmlString
//         .replace(/button/g, "action")

//     // 包裹為唯一根節點
//     const formattedXml = `<root>${xmlString}</root>`;

//     return formattedXml;
// }

// function downloadXmlFile(xmlContent, fileName) {
//     // 創建 Blob 將 XML 內容轉成文件
//     const blob = new Blob([xmlContent], { type: "application/xml" });

//     // 創建下載鏈接並模擬點擊
//     const link = document.createElement("a");
//     link.href = URL.createObjectURL(blob);
//     link.download = fileName;
//     link.click();
// }
