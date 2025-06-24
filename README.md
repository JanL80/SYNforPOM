# Polyoxometalate Explorer

An interactive single-page tool for browsing a curated library of polyoxometalate (POM) structures. You can filter by chemical or analytical metadata and, where available, request an AI-generated synthesis procedure.

---

## Use Guide

1. **Open the page** in any modern desktop or mobile browser. The full data table loads automatically, sorted A to Z by POM-ID.  
2. **Filter** using the form above the table.  
   * Multiple POM-IDs can be separated with commas or spaces.  
   * Leave a field blank to ignore it.  
3. **Show only synthesised entries** by ticking the checkbox. All rows lacking a procedure record disappear.  
4. **Click a POM-ID** to pop up a floating window. An OpenAI-powered backend drafts the synthesis and the result will be displayed shortly after.  
5. **Close** the pop-up with the x button.  
6. **Reset** the form at any time to clear all filters.  

---

## Notes & Limitations
 
* A cold Netlify Function can take around ten seconds before the first response; the on-screen spinner remains visible during that time.  
* The table is always alphabetically sorted by POM-ID.  
* Generated synthesis text is not stored; refreshing the page discards it but it can be regenerated at any time.  

---

## License & Citation

This project is released under the CC0 License.  

If this tool assists your research please cite:

**Polyoxometalate Explorer, v1.0 (2025). Available at https://github.com/JanL80/SYNforPOM.**
