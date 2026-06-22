def duyet_trong(goc):
    if goc is None: return
    if len(goc.danh_sach_con) > 0:
        duyet_trong(goc.danh_sach_con)
    print(goc.gia_tri)
    for con in goc.danh_sach_con[1:]:
        duyet_trong(con)
