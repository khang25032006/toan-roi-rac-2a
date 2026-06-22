def dfs_de_quy(do_thi, dinh_hien_tai, da_duyet, thu_tu_duyet):
    da_duyet[dinh_hien_tai] = True
    thu_tu_duyet.append(dinh_hien_tai)
    
    for dinh_ke in range(1, len(do_thi) + 1):
        if do_thi[dinh_hien_tai - 1][dinh_ke - 1] == 1 and not da_duyet[dinh_ke]:
            dfs_de_quy(do_thi, dinh_ke, da_duyet, thu_tu_duyet)