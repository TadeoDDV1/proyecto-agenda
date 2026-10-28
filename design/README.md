# Exploraciones de diseño

Documentos HTML autocontenidos para decidir el rediseño de AgendaSaaS antes de tocar la app. No forman parte del build de Next.js: son estáticos y se abren en el navegador.

## Cómo abrirlo

```bash
xdg-open design/exploraciones.html   # cinco direcciones estructurales (principal)
xdg-open design/direcciones.html     # estudio previo de temas de color
```

O con un servidor local, para que las fuentes externas se sirvan por HTTP:

```bash
python3 -m http.server 8080
# http://localhost:8080/design/exploraciones.html
# http://localhost:8080/design/direcciones.html
```

## exploraciones.html — cinco direcciones estructurales

Cada sección cambia la pantalla principal, el modelo de navegación, el flujo de reserva y el tipo de interacción. No son el mismo layout con otra paleta.

- **01 · Mostrador** — cockpit de recepción en tres columnas: cola de llegadas, pista del equipo y ficha del cliente. Tabs superiores, sin sidebar; alta densidad para trabajar de pie.
- **02 · Estudio** — portal público editorial con la carta de servicios y un rail de reserva que nunca desaparece. Sin wizard: la reserva se arma leyendo.
- **03 · Ritmo** — reserva por chat, mobile-first: hilo con tarjetas de turno y horarios alternativos, más un feed de actividad del equipo al lado.
- **04 · Panel** — admin semanal dark: rail de iconos, cinta de KPIs, rejilla de 7 días e inspector lateral del turno seleccionado.
- **05 · Vitrina** — micrositio de marca multi-tenant (tenant "Casa Nube"): hero gráfico, carta, equipo, reseñas y barra de reserva persistente.

Incluye una tabla comparativa (pantalla, navegación, flujo, fortalezas, esfuerzo, cuándo elegir) y una recomendación final: **Mostrador** para el admin y **Estudio** para el portal, con **Ritmo** como capa de WhatsApp y **Panel** / **Vitrina** según el segmento.

## direcciones.html — estudio previo de temas

Cuatro variantes sobre la **misma** plantilla de panel —solo cambian los tokens CSS—. Sirve como referencia de color y tipografía, no como propuesta de producto.

- **A · Nocturne 2.0** — evolución del dark actual, menor riesgo.
- **B · Atelier** — editorial claro con papel, tinta y oliva.
- **C · Studio** — producto denso y keyboard-first, claro/oscuro.
- **D · Maison** — dark boutique cálido con espresso, hueso y latón.

## Notas

- Ambos archivos usan Google Fonts (Fraunces e Inter); sin red caen a fuentes del sistema.
- El responsive de los mockups usa container queries: se adaptan al ancho del artboard, no al de la ventana. Validados a 1440, 768 y 390 px.
- Los controles son decorativos: no hay navegación ni acciones reales.
- Verificado: HTML sin etiquetas abiertas, CSS balanceado y una sola `<h1>` por documento.
