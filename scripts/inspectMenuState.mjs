import prisma from "../src/config/prisma.js";

async function main() {
  const roles = await prisma.role.findMany({
    select: { role_id: true, role_code: true, role_name: true },
    orderBy: { role_id: "asc" },
  });
  const menus = await prisma.menu.findMany({
    select: { menu_id: true, menu_name: true, is_active: true },
    orderBy: { menu_id: "asc" },
  });
  const roleMenus = await prisma.roleMenu.findMany({
    select: { role_id: true, menu_id: true },
  });
  const roleSubmenus = await prisma.roleSubmenu.findMany({
    select: { role_id: true, submenu_id: true },
  });

  const roleMenuByRole = roleMenus.reduce((acc, row) => {
    acc[row.role_id] = (acc[row.role_id] || 0) + 1;
    return acc;
  }, {});

  const roleSubmenuByRole = roleSubmenus.reduce((acc, row) => {
    acc[row.role_id] = (acc[row.role_id] || 0) + 1;
    return acc;
  }, {});

  console.log(JSON.stringify({
    roles,
    counts: {
      menus: menus.length,
      roleMenus: roleMenus.length,
      roleSubmenus: roleSubmenus.length,
    },
    roleMenuByRole,
    roleSubmenuByRole,
    menus,
  }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
