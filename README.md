# Magic Crest Status Bar

## 信息

The status bar applicable to MVU Zod in SillyTavern

jsDelivr地址：[cdn.jsdelivr.net/gh/xunyiiii/st-magic-crest-status-bar/dist/index.html](https://cdn.jsdelivr.net/gh/xunyiiii/st-magic-crest-status-bar/dist/index.html)

### 前置
- [SillyTavern](https://sillytavern.pro/)
- [Tavern-Helper](https://n0vi028.github.io/JS-Slash-Runner-Doc/)
- [MagVarUpdate](https://github.com/MagicalAstrogy/MagVarUpdate)
- 角色Lingyue

### 使用

- **自动式**

  导入角色即可；

- **手动式**

    1. 新建局部正则
    2. 查找正则表达式填`<StatusPlaceHolderImpl/>`;
    3. 替换为以下，注意是原文，包括头尾的```标记；

        ````html
        ```html
        <body>
          <script>
            $('body').load('http://localhost:4173/')
          </script>
        </body>
        ```
        ````




## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
3. Run the app:
   `npm run dev`
