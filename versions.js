// ============================================================
//  历史版本配置文件 (versions.js)
//  说明：管理所有可下载的历史版本包，以及更新日志链接
// ============================================================

const versionConfig = {
    // 更新日志文件路径（相对于当前页面，点击“更新日志”按钮时打开）
    changelogLink: './README.md',

    // 历史版本列表（按从旧到新排列，最后一个为最新版本，建议前端将“最新”标签显示在末尾）
    versions: [
        {
            version: 'v2.0.0',
            date: '2026-06-29',
            description: '完善部分内容，新增“我”界面、登录和注册界面，可以自定义用户名，优化部分设计逻辑，提升使用体验',
            filename: 'XiaoningClassmateV2.0.apk'
        },
        {
            version: 'v2.1.0',
            date: '2026-06-29',
            description: '完善部分内容，提升使用体验',
            filename: 'XiaoningClassmate2.1.apk'
        },
        {
            version: 'v2.2.0',
            date: '2026-06-29',
            description: '完善部分内容，优化部分设计逻辑，提升使用体验',
            filename: '小柠同学V2.2.apk'
        },
        {
            version: 'v2.2.1',
            date: '2026-06-30',
            description: '完善部分内容，优化部分设计逻辑，提升使用体验',
            filename: 'V2.2.1.apk'
        },
        {
            version: 'v2.2.9',
            date: '2026-06-30',
            description: '优化部分设计逻辑，提升使用体验',
            filename: '小柠同学2.2.9.apk'
        },
        {
            version: 'v2.3.0',
            date: '2026-06-30',
            description: '完善部分内容，新增“联网搜索”功能，优化部分设计逻辑，提升使用体验',
            filename: '小柠同学2.3.0.apk'
        },
        {
            version: 'v2.3.1',
            date: '2026-06-30',
            description: '完善部分内容，紧急修复一个登录bug，提升使用体验',
            filename: 'XiaoningClassmate.apk'
        }
    ]
};