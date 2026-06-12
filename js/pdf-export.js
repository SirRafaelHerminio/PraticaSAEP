/**
 * pdf-export.js
 * Geração de PDF com layout visual SAEP usando jsPDF
 * e exportação de DOCX usando a API Blob nativa do browser.
 *
 * Dependências (carregadas no index.html via CDN):
 *   - jsPDF  2.x  (window.jspdf.jsPDF)
 */

/* ── Constantes de layout ─────────────────────────────────── */
const PDF = {
  // Cores (RGB 0-255)
  ORANGE_DARK:  [217, 112, 20],   // #D97014 - gradiente capa
  ORANGE_LIGHT: [245, 162, 56],   // gradiente capa
  BLUE:         [13,  43,  78],   // #0D2B4E - headers seções
  WHITE:        [255, 255, 255],
  GRAY_TEXT:    [100, 100, 100],
  GRAY_LINE:    [200, 210, 220],
  INK:          [15,  31,  48],   // texto principal

  // Tipografia
  FONT_TITLE:   18,
  FONT_SECTION: 10,
  FONT_BODY:    9.5,
  FONT_SMALL:   8,
  FONT_META:    8.5,

  // Página A4 em mm
  W: 210,
  H: 297,
  MARGIN_X: 20,
  MARGIN_TOP: 18,
  MARGIN_BOT: 18,
};

const LOGO_B64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCABHAQQDASIAAhEBAxEB/8QAHAAAAgMBAQEBAAAAAAAAAAAAAAYEBQcDAgEI/8QASRAAAQMDAQIICgcECAcAAAAAAQACAwQFEQYSIQcTMUFhcYHRFBYyUXKRk6GxwRUiIzNUVeFSYpLSFyQlNFOisvA1QmNkc4LC/8QAGwEAAwEBAQEBAAAAAAAAAAAABAUGAwIBAAf/xAAzEQABBAECBAQDBwUBAAAAAAABAAIDBBEFEiExQVETYXHRBpGxFSJSgaHB4RQWIzLw8f/aAAwDAQACEQMRAD8A/GSkUFHU11S2npYjJI7mHIB5z5go60nR9tZQWmOQtHHzgPeefB5B2D5phptE3Jdp4Ac0NaseAzPVV9s0ZSxtDq+Z0z+djDstHbyn3K5hsVniGG2+A+m3a+KsUKzh0+tCMNYPqkT7MrzxcoZtNqI/4bR+wb3LhLYLNJ5VvhHo5b8FZoWprQu5sHyC4ErxycUtXLSdpFNLLEZqcsYXZD8jcOfKQVqGqZuI0/WPzjMex/Fu+azWhp31dZDSx+VK8NHRnnUprcEUczGRNwSOnrwTihI90bnPOVY6fsVVd3lzTxVO04dKRnf5gOcpxotLWenaNuB1Q/8AakcT7huVrQ00VHSR00DdmONuB3rsnlLSIIGDe0Od1z+yAnuySO+6cBQm2i1NGBbaTthafkg2i1HlttH2Qt7lNQmHgRfhHyQviP7lVslgs0nlW+EeiC34JB1RTU1He56akYWRM2d2ScEgE8vWtQWUXqcVN3q5gch0ztk9Gd3uSDX44o4m7WgEnsmWnOe55yTjCZtIaeoau2CtrYjMZCdhu0QAAcc3SCrrxasf4BvtHd6k6fh8HslHFjBELSesjJ95U5M6lCBsDA5gJwM8BzQk1mQyEhxx6pG1pYaahgjrKGIxx52JG5JA8x3+r1JVWt3GlZW0M1JJ5MrC3PmPMewrKKiJ8E8kEo2XxuLXDpCndbptglD2DDXfVNNPnMjC1x4hc1o9Jpezspo2zUnGSBo23F7t55+QpDs8PhF2pIcZD5mg9Wd61hE6BVjlD3yNB5DiMrHUZnMLWtOFUeLVj/AN9o7vWf3uKCC71UNM3ZijlLWjOcYOFqz3BjHPccBoyVkE8hmnkldyvcXHtK916OKJjGsaATnkAF9pz3vLi4krwrKwWeou9SWRHYiZ95IRub3lVq1LTlALdaIafZxIRtydLjy+rk7Eu0qiLcv3v9Rz9kVcsGFnDmVGotL2imYA6nM7+d0rs57ORTPoe1Yx9G0nsmqchWTKkDBhrB8kidNI45Liqat0zaKlhAphA/mfEcY7ORIV6t0truD6WU7WN7HAeU08hWrJK4SWAVNHJjeWOGeojvSfWqMIgMrG4I7I6hYeZNhOQUoq50Va471qq32yYOMU0v2gacEsALne4FUyf+Amk8I1q6oI3UtK94PSSG/BxUNemMNZ7xzAPz6Kq0muLN2KIjILhn06/otN/o60Z+SM9vL/ADI/o60Z+SM9vL/Mr283e2Wam8JudbDSx8xe7e7oA5SepZjqnhdJ26fTtHjm8JqB72s+ZPYoio3UrZ/xudjvk4X6nqD9E08f542Z7BoJ+WPrwWYXtlNHeq6OjaW0zKiRsIJzhgcdnfz7sIUQkkkk5JQv0BowAF+PPducSBjK+sG09oPOcLYWgNaGgYAGAscWr2WsZX2uCqaclzRt9Dhyj1qn+HHtDpG9Tj9/dKNUacNKmJO17NdYamN0Uk0dHsD60biBtc+cdicV8exsjCx7Wua4YIIyCn9ysbMRjDsJbBL4Tw4jKydtxuDfJrqodUru9dmXq7M5LjUnrkJ+Kab5pCGbamtrhDJymJ3knqPN/vkSZWUtRRzmCphdFIOZw/3lRlqvbpn75OO4JwnsMsM44AKRW3e5VkHEVNW+SPOdk45VZ6AgEt940jdDE5w6zu+ZS8nPg2hxHWVBHKWsB6sk/ELrTd1i4zec47+XFeWsRwO2jCcFxrpxTUU9ScfZRuf6hldlHudKK6gmpDI6MSt2S4DeAriTdsO3n0U+3G4Z5LL57jXzyulkrJy5xyfrkLn4ZV/ip/aFOPiTS/jpv4QjxJpfx038IUadJvk5I/X+U8F2sP8AxJzquqcCHVMxB5QZCvFNEZ6mKEcsjw0dpwmHUmm4LVbvCo6p73bYbsuaN+cqv0nDx+oaNuNzX7Z/9QT8kG+pKyw2GXmcefNbtmY6MvZyC05oDWhoGABgBCEL9BU0hIfCDb+IuDK5jfqTjD+hw7x8CnxV+o6AXG0TU4GZMbUfpDk7u1AalV/qa7mjmOI9UTUm8KUHokjQ0PG6ihdjIia559WPiVo6SuDeA+FVk5GCxjWes5PwCdUNoUeyoD3JP7fstdQdumx2UDUc3g9irJM4PFFo6zuHxWVrQtfzcXYeLz97K1vYMn5LPUn+IJN1gN7BHaa3ERPcq40hQ+HXyFrhmOL7V/ZyD14Wlpb4P6Hwe1uq3jD6h270RuHvz7kyJ1otbwawJ5u4+yAvy+JKQOQ4LlVzspqWWokP1I2Fx7AqTQs76m2VM8py99W9zushpXLhBreItbKRp+vUO3+iN59+F84OT/Y04/7g/wClq+fZ3ag2IdAfmf4XzYsVi89SmZJ/CU36tA7pkH+lOCU+Elv9Uo3eaRw9w7lprAzTf+X1C5onE7f+6JIV3pnU1y05HWC1mKOaqa1pmczacwDPk53b884PIqRPmiLTR/RcVfLTsfO9zi1zhnZAOBgdijK2n/aD/BOMcznyVA66+liZhIPTHPiFRQWq/agqTWVkkzy/lnqXEkjozvPwVjd9P0FosE87i6epIa1r3bgCSOQdWfOnNK/CNNs22ngB3yS7XYB+oVHLpVajVe4DJA6/LgEoF2azOMnmf+yUiIQhSacoVvpu+TWiYjZMlO8/Xjzz+cdKqELWGZ8Lw9hwQuHsbI3a4cFrNsuFJcYOOpJQ8f8AM3kc3oIUpZFR1VRRztnppXRSDnafj5096Z1LHcXtpKpgiqiPqkeS/uKrtP1llghknB36FJbNF0X3m8QmJQb1bKe6UboJmgOAzHJjew/75lOQnMkbZGljhkFAtcWnI5rIKmGSnqJIJRh8bi1w6QtB0HDxWn2Px97I5/vx8kqa2Y1mpKnZ3ZDSevZCfLDD4PZqOLGCIW56yMn3qX0ev4d2QfhyP1Ta9Lugae6moQk/W94raO5RU9HUuiAi2n7ON5JPcqG3aZVj8R/JLYYXTP2tTghZh4w3r8wl9Q7keMN6/MJfUO5Kf7hg/Cf090Z9mSdwmLhImxS0lPnynueewY+ar+DuHbu80xG6OE46yR8sqhrq2qrpRJVzvmcBgF3ME38G8OzR1dRjy5Az1DP/ANJfXmF3UxIBw9h7omVn9PULTz9ymxQb7cBbLc6rLA8tc0bPnyRn3ZU5K3CPNs26mgz95KXdjR+oVJfmMFd8g5gJVXjEkrWlM8UjJYmSxuDmPaHNI5wV6S3oG4eE2x1G92ZKc4HSw8nq3j1JkWlWcWIWyDqvJozE8sPRQ7db4qGWqfEf7xLxhGPJ3Dd68ntUxCFqxjWDa0YC4c4uOSk3hJm30dOD+08j1AfNKlDTvq6yGmj8qV4aOjPOrrX03G6gdHn7qNrPn81K4PKHja2WvePqwjZZ6R5fd8VGWIzc1IsHfH5Dn9E8id4FUO8vqnamhZT08cEYwyNoa0dAC9oQrUAAYCRE5Wb6yqn1t8l2WuMcP2TN3m5fflMXB0CLTUBwI+3PKP3QmZCVQaYYrRsF+Sc9O/5oyS2HwiINwhK/COP7LpneafH+UpoS3wiNzY4j5qhp/wArltqgzUk9FnUOJmpAWrWKHwezUcOMFsLc9ZGT71l1HEZ6uGAcskjWes4WvAAAADACTfDkf3nv9AjtUdwa1CReEabauVNBndHFtdpP6BPSzTWM3HaiqiDuYQwdgGfflHa9Jtq7e5Huh9ObmbPYKnQhCi0+VxpyxS3gTObO2FkWBktzklWUmiq0fd1lO70gR8irfg+h4uxulI3yzOPYAB8imJVtHSK8tZj5BxIzzKS2LsrJSGngFnz9HXZvI6md1SH5hWumdL1FFcGVtbJHmPJYxhzk4xvKbEIyLRasTw8A5HmsX35XtLT1QhCWtX3+OkgfQ0kgdUvGy9zT92OftR1myytGZHnghoonSu2tSnqCobW3+pma7LHSbLT5wMDPuWotAAAAwBuCxxapYLhHcrXFUNcC/AbIPM4cqQaDOHyy7v8AZ3H65+qZajGWsZjkOCnpR1Tp24XC6uq6Z0TmOaBhzsEYGE3IT21UjtM2SckuhmdC7c1Z54oXj9mD2iPFC8fswe0WhoS77Aq+fz/hFfaM3kshqoJKapkp5hiSNxa4ZzvC0TRMPE6dgJGDIXPPrwPcAs9r5vCK6eo/xJHP9ZytTtUPg9spYMYLImtPXjelugxg2HubyA+p/hFai8+E0HmVJSLwjTbVzp4Ad0cW12k/oE9LM9YzcfqKqIO5hDB2AA+/KZa9Jtq7e5HuhdObmbPYLnpiv+jrxDM52InHYk9E8/ZuPYtQWOLS9H3Dw+yx7bsyw/Zv7OQ+r5oH4ftcXQH1H7ojUoeUg9FcIQudTKIKaWZ3JGwuPYMqoJAGSlIGVl2oJvCL3WS5yDM4DqBwPgtD0zQ/R9mggcMSOG3J6R7tw7EiaWojcb7E142mNPGydQ7zgdq01TmhQl7n2XdTgfUppqD9obEOiFBuF3t1vlbFWVIie5u0Bsk7uwKcss1FW/SF4qKgHLNrZj9Ebh39qYapfNOMFoySeqFqVhO4g8gnzxlsf49vs3dynW64UdwjdJRzCVrTsuIaRg9qyVPPBuf6hVj/AKo+CA07WJrU4jeBg55Z90TaosijL2kpqS/r5udPk+aVp+KYFSa5GdNznzOYf8wTfUBmrJ6FBVjiZvqk3SEPH6ipGkbmuLz2An44WmpE4Oodu6zzkbo4cdpI7intL9Aj21d3cn2ROouzNjsELIq+bwiunn/xJHP9ZytSvU3g9oq5s4LYXEdeN3vWToL4jk4sZ6lb6W3g5yEIQplNleWXU1bbKZlK2KKaBhOA4EEZOeUdau4dbU5A46hlYf3Hh3xwhCYQ6rahaGtdwCGkpwvOSOK7jWlsxvp6z+Fv8y4T62pgPsKGZ5/fcG/DKELc65cI5j5LMafAOipbnqm6VjTGx7aaM80W4nt5fVhUR3nJQhLprEs7t0jslFMjZGMNGEKXbLjV22fjqSUsJ8ocrXDpCELNj3McHNOCF05ocMFNFJrZuyBV0J2ud0Ttx7D3qX46WvH93rP4G/zIQmjNbuNGN2fyQZoQE8l5drW3jyaWqPWGj5qFXa042nkip6Etc9paHuk5M8+MfNCF4/Wrjhjdj8gvW0IAc4Siw7Lw4gHBzg86cxrePG+3P9r+iEIWtdmq58I4z6LaWvHNjeOSDrePBxbn5/8AL+iUKqZ1RUy1D8bUry92POTlCF9ZvT2gBK7OPRfRV44s7AuStdOXmWz1L5Gx8bFI3D2bWM45DlCFhFK+F4ew4IWj2Ne0tdyTB47xflz/AGo7lCvOrn1tBJSwUnE8aNl73Pycc4G5CEc/V7b2lpfwPkPZDNpQNOQFB0xeorOZ3OpDM6XADg/GAM7uRXfjvF+XP9qO5CFzBqdmBgjjdgDyC6kqRSO3OHFR7jrI1FFLBBRuifI0tDzJnZzz8iUkIWFm3NZIMpzhaRQsiGGBCvNMX4WeOaN1MZhIQRh+MY7EIXEE74HiSM4IXUkbZG7Xclc+O8X5c/2o7lBvuqW3K2SUTKIx8YRlxkzjBB83QhCMk1e3Iwsc7geHIeywbShaQ4DkoemL4yzCcOpTNxuzvD8Yxno6VdeO8X5c/wBqO5CFzBqlmBgjY7AHkF7JUikducOKg33VX0jbZKOOkMXGY2nGTO4HPm6EsIQh7NqWy7fKclaxQsiG1gQhCEOtF//Z';

/* ── Ponto de entrada principal ───────────────────────────── */
function exportPDF(provaText, meta) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });

  // Registra fonte padrão com suporte a caracteres PT-BR
  doc.setFont('helvetica');

  // ── Página 1: Capa ──────────────────────────────────────
  drawCover(doc, meta);

  // ── Páginas seguintes: Conteúdo ─────────────────────────
  doc.addPage();
  const sections = parseProvaText(provaText);
  drawContent(doc, sections, meta);

  // ── Salva ───────────────────────────────────────────────
  const filename = 'prova_' + slugify(meta.course) + '_' + meta.diff + '_saep.pdf';
  doc.save(filename);
}

/* ── CAPA ─────────────────────────────────────────────────── */
function drawCover(doc, meta) {
  const W = PDF.W, H = PDF.H;

  // Fundo gradiente simulado com retângulos laranja
  // Retângulo principal laranja escuro
  doc.setFillColor(...PDF.ORANGE_DARK);
  doc.rect(0, 0, W, H, 'F');

  // Retângulo laranja claro (direita) para simular gradiente
  doc.setFillColor(...PDF.ORANGE_LIGHT);
  doc.rect(W * 0.55, 0, W * 0.45, H, 'F');

  // Formas decorativas — círculo grande desfocado no canto
  doc.setFillColor(245, 180, 80, 0.3);
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.3);

  // Overlay sutil branco no topo esquerdo
  doc.setFillColor(255, 255, 255);
  doc.setGState(doc.GState({ opacity: 0.06 }));
  doc.rect(0, 0, W * 0.45, H, 'F');
  doc.setGState(doc.GState({ opacity: 1 }));

  // ── Badge "CADERNO DE PROVA DO ESTUDANTE" (canto sup esq) ──
  doc.setFillColor(...PDF.ORANGE_DARK);
  doc.setDrawColor(...PDF.ORANGE_DARK);
  doc.rect(0, 0, 52, 24, 'F');

  doc.setTextColor(...PDF.WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('CADERNO DE', 5, 9);
  doc.setFontSize(10);
  doc.text('PROVA DO', 5, 15);
  doc.text('ESTUDANTE', 5, 21);

  // ── Logo SENAI ──────────────────────────────────────────
  try {
    doc.addImage('data:image/png;base64,' + LOGO_B64, 'PNG', W - 65, 12, 50, 16);
  } catch(e) {
    // fallback: texto se a logo falhar
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(...PDF.WHITE);
    doc.text('SENAI', W - 45, 24);
  }

  // ── Título principal ────────────────────────────────────
  doc.setTextColor(...PDF.WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(32);
  doc.text('Sistema de', W / 2, 90, { align: 'center' });
  doc.text('Avaliação da', W / 2, 105, { align: 'center' });
  doc.text('Educação', W / 2, 120, { align: 'center' });
  doc.text('Profissional - SAEP', W / 2, 135, { align: 'center' });

  // ── Subtítulo ───────────────────────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setDrawColor(...PDF.WHITE);
  doc.setLineWidth(0.5);
  doc.line(W / 2 - 30, 142, W / 2 + 30, 142);
  doc.text('Avaliação Prática de Desempenho', W / 2, 149, { align: 'center' });
  doc.text('dos Estudantes', W / 2, 156, { align: 'center' });

  // ── Caixa de dados do estudante ─────────────────────────
  const boxX = 35, boxY = 175, boxW = 140, boxH = 68;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(255, 255, 255);
  doc.roundedRect(boxX, boxY, boxW, boxH, 5, 5, 'F');

  doc.setTextColor(...PDF.INK);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);

  const rows = [
    ['Curso',                      meta.course],
    ['Versão do Itinerário',       meta.itinerario || '{{itinerario}}'],
    ['Estudante',                  '{{nome}}'],
    ['CPF',                        '{{cpf}}'],
    ['UF',                         '{{uf}}'],
  ];

  rows.forEach(([label, value], i) => {
    const y = boxY + 12 + (i * 11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PDF.INK);
    doc.text(label, boxX + 8, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF.GRAY_TEXT);
    doc.text(value, boxX + 58, y);
  });

  // ── Logo SAP (canto inferior direito) ───────────────────
  doc.setFillColor(...PDF.BLUE);
  doc.rect(W - 52, H - 24, 52, 24, 'F');
  doc.setTextColor(...PDF.WHITE);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('sap', W - 38, H - 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text('SISTEMA DE', W - 26, H - 16);
  doc.text('AVALIAÇÃO PRÁTICA', W - 26, H - 11);
}

/* ── CONTEÚDO ─────────────────────────────────────────────── */
function drawContent(doc, sections, meta) {
  const W = PDF.W;
  const marginX = PDF.MARGIN_X;
  const contentW = W - marginX * 2;
  let y = PDF.MARGIN_TOP;
  let pageNum = 2;

  function addHeader(pageN) {
    // Rodapé com paginação
    doc.setFillColor(...PDF.BLUE);
    doc.rect(0, PDF.H - 12, PDF.W, 12, 'F');
    doc.setTextColor(...PDF.WHITE);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('Sistema de Avaliação da Educação Profissional', PDF.W / 2, PDF.H - 7, { align: 'center' });
    doc.text('Avaliação Prática de Desempenho dos Estudantes', PDF.W / 2, PDF.H - 3.5, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.text(pageN + ' / ?', PDF.W - marginX, PDF.H - 5.5, { align: 'right' });

    // Linha fina no topo
    doc.setDrawColor(...PDF.GRAY_LINE);
    doc.setLineWidth(0.3);
    doc.line(marginX, PDF.MARGIN_TOP - 4, W - marginX, PDF.MARGIN_TOP - 4);
  }

  function checkPage(neededHeight) {
    if (y + neededHeight > PDF.H - PDF.MARGIN_BOT - 12) {
      addHeader(pageNum);
      doc.addPage();
      pageNum++;
      y = PDF.MARGIN_TOP;
    }
  }

  // Desenha cada seção
  sections.forEach(section => {
    if (section.title) {
      checkPage(14);

      // Barra azul do título da seção
      doc.setFillColor(...PDF.BLUE);
      doc.rect(marginX, y, contentW, 7, 'F');
      doc.setTextColor(...PDF.WHITE);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(PDF.FONT_SECTION);
      doc.text(section.title.toUpperCase(), marginX + 3, y + 5);
      y += 10;
    }

    // Conteúdo da seção
    if (section.content) {
      doc.setTextColor(...PDF.INK);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(PDF.FONT_BODY);

      const lines = section.content.split('\n').filter(l => l.trim());

      lines.forEach(line => {
        const l = line.trim();
        if (!l) return;

        const isBullet = l.match(/^[-•*]\s/) || l.match(/^\d+\.\s/);
        const prefix   = isBullet ? '  • ' : '';
        const text     = isBullet ? l.replace(/^[-•*\d.]\s*/, '') : l;
        const bold     = l.match(/^\*\*(.*)\*\*$/) || l.match(/^Entrega \d/i);

        const wrapped = doc.splitTextToSize(prefix + text, contentW - (isBullet ? 8 : 0));
        checkPage(wrapped.length * 5 + 2);

        if (bold) {
          doc.setFont('helvetica', 'bold');
        } else {
          doc.setFont('helvetica', 'normal');
        }

        const xOff = isBullet ? marginX + 5 : marginX;
        doc.text(wrapped, xOff, y);
        y += wrapped.length * 5 + 1;
      });

      y += 3; // espaço após seção
    }
  });

  // Rodapé da última página
  addHeader(pageNum);

  // Atualiza total de páginas nos rodapés (aproximação)
  // jsPDF não suporta "total pages" nativamente sem hack — deixamos "?" ou pageNum
}

/* ── PARSER DE TEXTO DA IA ────────────────────────────────── */
function parseProvaText(text) {
  const sections = [];
  const lines    = text.split('\n');

  let currentTitle   = '';
  let currentContent = '';

  function flush() {
    const content = currentContent
      .replace(/\*\*(.*?)\*\*/g, '') // remove markdown bold
      .replace(/\*(.*?)\*/g, '')      // remove markdown italic
      .replace(/#{1,3}\s/g, '')         // remove markdown headers
      .trim();

    if (currentTitle || content) {
      sections.push({ title: currentTitle, content });
    }
    currentTitle   = '';
    currentContent = '';
  }

  lines.forEach(line => {
    const l = line.trim();

    const isSectionHeader =
      l.match(/^---+$/) ||
      (l === l.toUpperCase() && l.length > 5 && l.length < 80
        && !l.match(/^[-•*\d]/) && l.match(/[A-ZÁÉÍÓÚ]/)) ||
      l.match(/^#{1,3}\s/);

    if (isSectionHeader) {
      flush();
      currentTitle = l.replace(/^---+$/, '').replace(/^#{1,3}\s*/, '').trim();
    } else {
      currentContent += line + '\n';
    }
  });

  flush();
  return sections.filter(s => s.title || s.content);
}

/* ── EXPORTAÇÃO DOCX (simples via Blob) ──────────────────── */
function exportDOCX(provaText, meta) {
  // Gera um RTF bem formatado disfarçado de .doc
  // (compatível com Word, LibreOffice, Google Docs)
  const diffLabel = { easy: 'Fácil', med: 'Médio', hard: 'Difícil' }[meta.diff] || meta.diff;

  let rtf = '{\rtf1\ansi\deff0\n';
  rtf += '{\fonttbl{\f0 Arial;}}\n';
  rtf += '{\colortbl;\red13\green43\blue78;\red227\green0\blue15;\red255\green255\blue255;}\n';
  rtf += '\paperw11906\paperh16838\margl1440\margr1440\margt1440\margb1440\n';

  // Cabeçalho
  rtf += '{\header \pard\qr\cf1\b\fs16 ' + escRTF(meta.course) + '\b0\par}\n';
  rtf += '{\footer \pard\qc\cf1\fs14 Sistema de Avaliação da Educação Profissional — Avaliação Prática de Desempenho dos Estudantes\par}\n';

  // Título
  rtf += '\pard\qc\cf1\b\fs36 CADERNO DE PROVA DO ESTUDANTE\b0\par\n';
  rtf += '\pard\qc\fs20 ' + escRTF(meta.course) + '\par\n';
  rtf += '\pard\qc\fs18 Nível: ' + diffLabel + ' | Gerado em: ' + meta.date + '\par\n';
  rtf += '\par\n';

  // Campos do estudante
  const campos = [
    ['Curso', meta.course],
    ['Versão do Itinerário Formativo', '{{itinerario}}'],
    ['Estudante', '{{nome}}'],
    ['CPF', '{{cpf}}'],
    ['UF', '{{uf}}'],
  ];

  campos.forEach(([k, v]) => {
    rtf += '\pard\fs18 \b ' + escRTF(k) + ':\b0  ' + escRTF(v) + '\par\n';
  });
  rtf += '\par\par\n';

  // Conteúdo da prova
  const lines = provaText.split('\n');
  lines.forEach(line => {
    const l = line.trim();
    if (!l) { rtf += '\pard\par\n'; return; }

    if (l.match(/^---+$/)) {
      rtf += '\pard\brdrb\brdrs\brdrw10 \par\n';
      return;
    }

    // Título de seção (all caps)
    if (l === l.toUpperCase() && l.length > 5 && l.match(/[A-ZÁÉÍÓÚ]/)) {
      rtf += '\pard\cb1\cf3\b\fs20 ' + escRTF(l) + '\b0\cf1\cb0\par\n';
      return;
    }

    // Bullet
    if (l.match(/^[-•*]\s/)) {
      const text = l.replace(/^[-•*]\s/, '').replace(/\*\*(.*?)\*\*/g, '');
      rtf += '\pard\li360\fi-180\fs18 • ' + escRTF(text) + '\par\n';
      return;
    }

    // Linha normal com bold markdown
    const processed = l
      .replace(/\*\*(.*?)\*\*/g, '\b \b0 ')
      .replace(/\*(.*?)\*/g, '\i \i0 ');
    rtf += '\pard\fs18 ' + escRTF(processed) + '\par\n';
  });

  rtf += '}';

  const blob = new Blob([rtf], { type: 'application/msword' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = 'prova_' + slugify(meta.course) + '_' + meta.diff + '_saep.doc';
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Utils ────────────────────────────────────────────────── */
function escRTF(str) {
  if (!str) return '';
  str = str.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\*(.*?)\*/g, '$1');
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const c    = str[i];
    const code = str.charCodeAt(i);
    if (c === '\\')     { result += '\\\\'; }
    else if (c === '{')  { result += '\\{'; }
    else if (c === '}')  { result += '\\}'; }
    else if (code > 127) { result += '\\u' + code + '?'; }
    else                 { result += c; }
  }
  return result;
}
function slugify(str) {
  return (str || 'curso')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 30);
}
