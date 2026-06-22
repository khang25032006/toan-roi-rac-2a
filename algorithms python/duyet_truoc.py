def duyet_truoc(goc):
    if goc is None: return
    print(goc.gia_tri)
    for con in goc.danh_sach_con:
        duyet_truoc(con)