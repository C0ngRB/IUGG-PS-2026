document.addEventListener("DOMContentLoaded", function () {
    const menuToggle = document.getElementById("menuToggle");
    const navDrawer = document.getElementById("navDrawer");
    const navOverlay = document.getElementById("navOverlay");
    const header = document.querySelector(".site-header");
    const navLinks = document.querySelectorAll(".nav-desktop .nav-link, .nav-drawer .nav-link");

    // 计算带 header 偏移的滚动
    function scrollToHash(hash) {
        const target = document.querySelector(hash);
        if (!target) return;

        const headerHeight = header ? header.offsetHeight : 0;
        const rect = target.getBoundingClientRect();
        const offsetTop = rect.top + window.pageYOffset - headerHeight - 8;

        window.scrollTo({
            top: offsetTop,
            behavior: "smooth"
        });
    }

    // 设置当前激活的导航链接（顶部 + 抽屉）
    function setActive(hash) {
        navLinks.forEach(link => {
            if (link.getAttribute("href") === hash) {
                link.classList.add("active");
            } else {
                link.classList.remove("active");
            }
        });
    }

    // 关闭抽屉导航
    function closeDrawer() {
        if (navDrawer) {
            navDrawer.classList.remove("open");
        }
        if (menuToggle) {
            menuToggle.classList.remove("open");
        }
        if (navOverlay) {
            navOverlay.classList.remove("open");
        }
    }

    // 绑定导航链接点击事件
    navLinks.forEach(link => {
        link.addEventListener("click", function (e) {
            const href = this.getAttribute("href");
            if (!href || !href.startsWith("#")) {
                return;
            }
            e.preventDefault();

            scrollToHash(href);
            setActive(href);

            // 关闭抽屉导航
            closeDrawer();

            // 同步 URL hash（可选）
            history.replaceState(null, "", href);
        });
    });

    // 汉堡按钮控制抽屉导航和遮罩层
    if (menuToggle && navDrawer) {
        menuToggle.addEventListener("click", function () {
            const willOpen = !navDrawer.classList.contains("open");
            navDrawer.classList.toggle("open", willOpen);
            menuToggle.classList.toggle("open", willOpen);
            if (navOverlay) {
                navOverlay.classList.toggle("open", willOpen);
            }
        });
    }

    // 点击遮罩层关闭抽屉
    if (navOverlay) {
        navOverlay.addEventListener("click", function () {
            closeDrawer();
        });
    }

    // 初始 hash
    const initialHash = window.location.hash || "#home";
    setActive(initialHash);
    if (initialHash !== "#home") {
        scrollToHash(initialHash);
    }

    // 向下滚动隐藏，向上滚动显示 header
    let lastScrollY = window.pageYOffset || 0;

    function handleScroll() {
        if (!header) return;

        const currentY = window.pageYOffset || 0;
        const delta = currentY - lastScrollY;
        const threshold = 5; // 忽略微小抖动

        if (Math.abs(delta) > threshold) {
            if (delta > 0 && currentY > header.offsetHeight) {
                header.classList.add("header-hidden");
            } else {
                header.classList.remove("header-hidden");
            }
            lastScrollY = currentY;
        }
    }

    window.addEventListener("scroll", handleScroll, { passive: true });

    // ===== Committees Members 折叠逻辑 =====
    const collapseToggles = document.querySelectorAll("[data-collapse-target]");

    collapseToggles.forEach(btn => {
        btn.addEventListener("click", function () {
            const targetSelector = btn.getAttribute("data-collapse-target");
            if (!targetSelector) return;
            const panel = document.querySelector(targetSelector);
            if (!panel) return;

            const isOpen = panel.classList.toggle("open");
            btn.classList.toggle("open", isOpen);

            const labelOpen = btn.getAttribute("data-label-open") || "Hide members";
            const labelClosed = btn.getAttribute("data-label-closed") || "Show members";
            btn.textContent = isOpen ? labelOpen : labelClosed;
        });
    });
});
