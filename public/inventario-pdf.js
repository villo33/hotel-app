import {
  jsPDF
} from "https://cdn.jsdelivr.net/npm/jspdf@2.5.2/+esm";


/* =====================================
   LOGO
====================================== */

const LOGO_URL =
  new URL(
    "./logo-512.png",
    window.location.href
  ).href;


/* =====================================
   CARGAR LOGO
====================================== */

function cargarImagen(src) {

  return new Promise(
    (
      resolve,
      reject
    ) => {

      const img =
        new Image();

      img.onload =
        () => {

          console.log(
            "✅ Logo cargado correctamente:",
            src
          );

          resolve(img);

        };


      img.onerror =
        () => {

          reject(
            new Error(
              `No se pudo cargar el logo: ${src}`
            )
          );

        };


      img.src =
        src;

    }
  );

}


/* =====================================
   FORMATO NÚMERO
====================================== */

function formatoNumero(
  valor
) {

  return new Intl.NumberFormat(
    "es-CO"
  ).format(
    Number(valor) || 0
  );

}


/* =====================================
   FECHA
====================================== */

function obtenerFecha() {

  return new Date().toLocaleDateString(
    "es-CO",
    {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }
  );

}


/* =====================================
   HORA
====================================== */

function obtenerHora() {

  return new Date().toLocaleTimeString(
    "es-CO",
    {
      hour: "2-digit",
      minute: "2-digit"
    }
  );

}


/* =====================================
   TEXTO SEGURO
====================================== */

function textoSeguro(
  valor,
  fallback = "—"
) {

  const texto =
    String(
      valor ?? ""
    ).trim();


  return texto ||
    fallback;

}


/* =====================================
   LIMITAR TEXTO
====================================== */

function limitarTexto(
  texto,
  maximo
) {

  const valor =
    textoSeguro(
      texto,
      ""
    );


  if (
    valor.length <=
    maximo
  ) {

    return valor;

  }


  return (
    valor.substring(
      0,
      maximo - 3
    ) +
    "..."
  );

}


/* =====================================
   ESTADO
====================================== */

function obtenerEstado(
  cantidad,
  minimo
) {

  const stock =
    Number(
      cantidad
    ) || 0;


  const min =
    Number(
      minimo
    ) || 0;


  if (
    stock <= 0
  ) {

    return {
      texto: "AGOTADO",
      faltan: min
    };

  }


  if (
    stock <= min
  ) {

    return {
      texto: "STOCK BAJO",
      faltan:
        Math.max(
          min - stock,
          0
        )
    };

  }


  return {
    texto: "DISPONIBLE",
    faltan: 0
  };

}


/* =====================================
   FORMATEAR FECHA
====================================== */

function formatearFecha(
  valor
) {

  if (!valor) {
    return "—";
  }


  const fecha =
    String(
      valor
    ).substring(
      0,
      10
    );


  const partes =
    fecha.split("-");


  if (
    partes.length !== 3
  ) {

    return fecha;

  }


  return (
    partes[2] +
    "/" +
    partes[1] +
    "/" +
    partes[0]
  );

}


/* =====================================
   PIE DE PÁGINA
====================================== */

function dibujarPiePagina(
  doc,
  pagina,
  totalPaginas
) {

  const ancho =
    doc.internal.pageSize.getWidth();

  const alto =
    doc.internal.pageSize.getHeight();


  doc.setDrawColor(
    220,
    226,
    234
  );


  doc.line(
    12,
    alto - 12,
    ancho - 12,
    alto - 12
  );


  doc.setFont(
    "helvetica",
    "normal"
  );


  doc.setFontSize(
    7
  );


  doc.setTextColor(
    120,
    130,
    145
  );


  doc.text(
    "CASA NOA · Reporte de inventario",
    12,
    alto - 6
  );


  doc.text(
    `Página ${pagina} de ${totalPaginas}`,
    ancho - 12,
    alto - 6,
    {
      align: "right"
    }
  );

}


/* =====================================
   ENCABEZADO
====================================== */

function dibujarEncabezado(
  doc,
  logo
) {

  const ancho =
    doc.internal.pageSize.getWidth();


  /* LOGO */

  if (logo) {

    try {

      doc.addImage(
        logo,
        "PNG",
        12,
        9,
        24,
        24
      );

    } catch (error) {

      console.warn(
        "⚠️ No se pudo insertar el logo en el PDF:",
        error
      );

    }

  }


  /* CASA NOA */

  doc.setFont(
    "helvetica",
    "bold"
  );


  doc.setFontSize(
    19
  );


  doc.setTextColor(
    7,
    26,
    58
  );


  doc.text(
    "CASA NOA",
    42,
    18
  );


  doc.setFont(
    "helvetica",
    "normal"
  );


  doc.setFontSize(
    8
  );


  doc.setTextColor(
    100,
    116,
    139
  );


  doc.text(
    "Gestión hotelera",
    42,
    24
  );


  /* TÍTULO */

  doc.setFont(
    "helvetica",
    "bold"
  );


  doc.setFontSize(
    15
  );


  doc.setTextColor(
    7,
    26,
    58
  );


  doc.text(
    "REPORTE DE INVENTARIO",
    12,
    45
  );


  /* FECHA */

  doc.setFont(
    "helvetica",
    "normal"
  );


  doc.setFontSize(
    8
  );


  doc.setTextColor(
    100,
    116,
    139
  );


  doc.text(
    `Generado: ${obtenerFecha()} · ${obtenerHora()}`,
    12,
    51
  );


  /* LÍNEA */

  doc.setDrawColor(
    213,
    220,
    230
  );


  doc.line(
    12,
    56,
    ancho - 12,
    56
  );

}


/* =====================================
   RESUMEN
====================================== */

function dibujarResumen(
  doc,
  inventario,
  y
) {

  const ancho =
    doc.internal.pageSize.getWidth();


  const totalProductos =
    inventario.length;


  const totalUnidades =
    inventario.reduce(
      (
        total,
        item
      ) =>
        total +
        (
          Number(
            item.cantidad
          ) || 0
        ),
      0
    );


  const bajo =
    inventario.filter(
      item => {

        const stock =
          Number(
            item.cantidad
          ) || 0;


        const minimo =
          Number(
            item.stock_minimo
          ) || 0;


        return (
          stock > 0 &&
          stock <= minimo
        );

      }
    ).length;


  const agotado =
    inventario.filter(
      item =>
        (
          Number(
            item.cantidad
          ) || 0
        ) <= 0
    ).length;


  const valores = [

    {
      titulo: "PRODUCTOS",
      valor: totalProductos,
      color: [
        7,
        26,
        58
      ]
    },

    {
      titulo: "UNIDADES",
      valor: totalUnidades,
      color: [
        37,
        99,
        235
      ]
    },

    {
      titulo: "STOCK BAJO",
      valor: bajo,
      color: [
        217,
        119,
        6
      ]
    },

    {
      titulo: "AGOTADOS",
      valor: agotado,
      color: [
        185,
        28,
        28
      ]
    }

  ];


  const margen =
    12;


  const espacio =
    5;


  const anchoTarjeta =
    (
      ancho -
      margen * 2 -
      espacio * 3
    ) / 4;


  valores.forEach(
    (
      item,
      index
    ) => {

      const x =
        margen +
        index *
        (
          anchoTarjeta +
          espacio
        );


      doc.setFillColor(
        248,
        250,
        252
      );


      doc.setDrawColor(
        228,
        233,
        240
      );


      doc.roundedRect(
        x,
        y,
        anchoTarjeta,
        20,
        3,
        3,
        "FD"
      );


      doc.setFont(
        "helvetica",
        "bold"
      );


      doc.setFontSize(
        7
      );


      doc.setTextColor(
        100,
        116,
        139
      );


      doc.text(
        item.titulo,
        x + 5,
        y + 7
      );


      doc.setFontSize(
        13
      );


      doc.setTextColor(
        ...item.color
      );


      doc.text(
        formatoNumero(
          item.valor
        ),
        x + 5,
        y + 16
      );

    }
  );


  return y + 27;

}


/* =====================================
   TABLA
====================================== */

function dibujarTabla(
  doc,
  filas,
  yInicial
) {

  const margen =
    12;


  const ancho =
    doc.internal.pageSize.getWidth();


  const columnas = [

    {
      titulo: "PRODUCTO",
      ancho: 46
    },

    {
      titulo: "CATEGORÍA",
      ancho: 34
    },

    {
      titulo: "STOCK",
      ancho: 17
    },

    {
      titulo: "MÍN.",
      ancho: 17
    },

    {
      titulo: "FALTAN",
      ancho: 19
    },

    {
      titulo: "ESTADO",
      ancho: 31
    },

    {
      titulo: "ENCARGADO",
      ancho: 42
    },

    {
      titulo: "FECHA",
      ancho: 27
    },

    {
      titulo: "ID",
      ancho:
        ancho -
        margen * 2 -
        (
          46 +
          34 +
          17 +
          17 +
          19 +
          31 +
          42 +
          27
        )
    }

  ];


  const alturaCabecera =
    9;


  const alturaFila =
    9;


  let y =
    yInicial;


  let pagina =
    1;


  const altoPagina =
    doc.internal.pageSize.getHeight();


  const altoDisponible =
    altoPagina -
    20;


  function dibujarCabecera() {

    let x =
      margen;


    doc.setFillColor(
      7,
      26,
      58
    );


    doc.rect(
      margen,
      y,
      ancho - margen * 2,
      alturaCabecera,
      "F"
    );


    doc.setFont(
      "helvetica",
      "bold"
    );


    doc.setFontSize(
      6.7
    );


    doc.setTextColor(
      255,
      255,
      255
    );


    columnas.forEach(
      columna => {

        doc.text(
          columna.titulo,
          x + 2,
          y + 6
        );


        x +=
          columna.ancho;

      }
    );


    y +=
      alturaCabecera;

  }


  dibujarCabecera();


  filas.forEach(
    (
      fila,
      index
    ) => {

      if (
        y +
        alturaFila >
        altoDisponible
      ) {

        doc.addPage();


        pagina++;


        y = 18;


        dibujarCabecera();

      }


      const estado =
        obtenerEstado(
          fila.cantidad,
          fila.stock_minimo
        );


      if (
        index % 2 === 0
      ) {

        doc.setFillColor(
          249,
          251,
          253
        );


        doc.rect(
          margen,
          y,
          ancho - margen * 2,
          alturaFila,
          "F"
        );

      }


      let x =
        margen;


      doc.setFont(
        "helvetica",
        "normal"
      );


      doc.setFontSize(
        6.8
      );


      /* PRODUCTO */

      doc.setTextColor(
        30,
        41,
        59
      );


      doc.text(
        limitarTexto(
          fila.nombre,
          27
        ),
        x + 2,
        y + 6
      );


      x +=
        columnas[0].ancho;


      /* CATEGORÍA */

      doc.setTextColor(
        71,
        85,
        105
      );


      doc.text(
        limitarTexto(
          fila.categoria ||
          "General",
          20
        ),
        x + 2,
        y + 6
      );


      x +=
        columnas[1].ancho;


      /* STOCK */

      doc.setTextColor(
        30,
        41,
        59
      );


      doc.text(
        formatoNumero(
          fila.cantidad
        ),
        x + 2,
        y + 6
      );


      x +=
        columnas[2].ancho;


      /* MÍNIMO */

      doc.text(
        formatoNumero(
          fila.stock_minimo
        ),
        x + 2,
        y + 6
      );


      x +=
        columnas[3].ancho;


      /* FALTAN */

      doc.text(
        formatoNumero(
          estado.faltan
        ),
        x + 2,
        y + 6
      );


      x +=
        columnas[4].ancho;


      /* ESTADO */

      if (
        estado.texto ===
        "AGOTADO"
      ) {

        doc.setTextColor(
          185,
          28,
          28
        );

      } else if (
        estado.texto ===
        "STOCK BAJO"
      ) {

        doc.setTextColor(
          180,
          83,
          9
        );

      } else {

        doc.setTextColor(
          22,
          101,
          52
        );

      }


      doc.setFont(
        "helvetica",
        "bold"
      );


      doc.text(
        estado.texto,
        x + 2,
        y + 6
      );


      doc.setFont(
        "helvetica",
        "normal"
      );


      x +=
        columnas[5].ancho;


      /* ENCARGADO */

      doc.setTextColor(
        71,
        85,
        105
      );


      doc.text(
        limitarTexto(
          fila.encargado,
          24
        ),
        x + 2,
        y + 6
      );


      x +=
        columnas[6].ancho;


      /* FECHA */

      doc.text(
        formatearFecha(
          fila.fecha
        ),
        x + 2,
        y + 6
      );


      x +=
        columnas[7].ancho;


      /* ID */

      doc.text(
        String(
          fila.id ??
          ""
        ),
        x + 2,
        y + 6
      );


      doc.setDrawColor(
        232,
        236,
        241
      );


      doc.line(
        margen,
        y + alturaFila,
        ancho - margen,
        y + alturaFila
      );


      y +=
        alturaFila;

    }
  );


  return {
    pagina
  };

}


/* =====================================
   GENERAR PDF
====================================== */

export async function generarPDFInventario(
  inventario = [],
  categorias = []
) {

  if (
    !Array.isArray(
      inventario
    )
  ) {

    throw new Error(
      "Los datos del inventario no son válidos."
    );

  }


  if (
    inventario.length === 0
  ) {

    throw new Error(
      "No hay productos para generar el PDF."
    );

  }


  /* =====================================
     CREAR PDF
  ====================================== */

  const doc =
    new jsPDF(
      {
        orientation:
          "landscape",

        unit:
          "mm",

        format:
          "a4"
      }
    );


  /* =====================================
     CARGAR LOGO
  ====================================== */

  let logo =
    null;


  try {

    logo =
      await cargarImagen(
        LOGO_URL
      );

  } catch (error) {

    console.warn(
      "⚠️ Logo no disponible:",
      error
    );

  }


  /* =====================================
     ORDENAR PRODUCTOS
  ====================================== */

  const productos =
    [...inventario].sort(
      (
        a,
        b
      ) => {

        const categoriaA =
          String(
            a.categoria ||
            "General"
          ).toLowerCase();


        const categoriaB =
          String(
            b.categoria ||
            "General"
          ).toLowerCase();


        if (
          categoriaA <
          categoriaB
        ) {

          return -1;

        }


        if (
          categoriaA >
          categoriaB
        ) {

          return 1;

        }


        return String(
          a.nombre ||
          ""
        ).localeCompare(
          String(
            b.nombre ||
            ""
          ),
          "es"
        );

      }
    );


  /* =====================================
     ENCABEZADO
  ====================================== */

  dibujarEncabezado(
    doc,
    logo
  );


  let y =
    63;


  /* =====================================
     RESUMEN
  ====================================== */

  y =
    dibujarResumen(
      doc,
      inventario,
      y
    );


  /* =====================================
     INFORMACIÓN
  ====================================== */

  doc.setFont(
    "helvetica",
    "normal"
  );


  doc.setFontSize(
    7.5
  );


  doc.setTextColor(
    100,
    116,
    139
  );


  doc.text(
    `Categorías registradas: ${categorias.length}`,
    12,
    y
  );


  doc.text(
    `Productos incluidos: ${productos.length}`,
    12,
    y + 5
  );


  y +=
    12;


  /* =====================================
     TABLA
  ====================================== */

  dibujarTabla(
    doc,
    productos,
    y
  );


  /* =====================================
     PIE DE PÁGINA
  ====================================== */

  const totalPaginas =
    doc.internal
      .getNumberOfPages();


  for (
    let pagina = 1;
    pagina <=
    totalPaginas;
    pagina++
  ) {

    doc.setPage(
      pagina
    );


    dibujarPiePagina(
      doc,
      pagina,
      totalPaginas
    );

  }


  /* =====================================
     GUARDAR
  ====================================== */

  const fechaArchivo =
    new Date()
      .toISOString()
      .substring(
        0,
        10
      );


  const nombreArchivo =
    `inventario-casa-noa-${fechaArchivo}.pdf`;


  doc.save(
    nombreArchivo
  );


  console.log(
    "✅ PDF generado:",
    nombreArchivo
  );


  return {
    archivo:
      nombreArchivo,

    paginas:
      totalPaginas,

    productos:
      productos.length
  };

}