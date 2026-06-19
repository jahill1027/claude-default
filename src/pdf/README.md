# pdf

PDF export (Section 9 / M6). Holds the official ToV sheet (or a self-generated
fallback), the AcroForm field-mapping module, and the pdf-lib fill logic.
Output stays form-fillable. The field mapping is written defensively: warn on
unmapped/missing fields rather than crashing.
