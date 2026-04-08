const XLSX = require('xlsx');

const products = [];

for (let i = 1; i <= 20000; i++) {
  products.push({
    nombre: `Producto ${i}`,
    precio: Math.floor(Math.random() * 10000) / 100,
    stock: Math.floor(Math.random() * 500),
    categoria: ['Electronica', 'Ropa', 'Alimentos', 'Hogar', 'Deportes', 'Juguetes', 'Otros'][Math.floor(Math.random() * 7)]
  });
}

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(products);
XLSX.utils.book_append_sheet(wb, ws, 'Productos');

XLSX.writeFile(wb, 'productos_prueba.xlsx');

console.log('✅ Listo! Columnas: nombre, precio, stock, categoria');
