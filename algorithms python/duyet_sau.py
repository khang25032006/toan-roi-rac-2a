def duyet_sau(goc):
    if goc is None: return
    for con in goc.danh_sach_con:
        duyet_sau(con)
    print(goc.gia_tri)