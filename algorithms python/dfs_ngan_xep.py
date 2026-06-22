def dfs_ngan_xep(do_thi, dinh_bat_dau):
    da_duyet = [False] * (len(do_thi) + 1)
    ngan_xep = [dinh_bat_dau]
    thu_tu_duyet = []
    
    while ngan_xep:
        dinh_hien_tai = ngan_xep.pop()
        if not da_duyet[dinh_hien_tai]:
            da_duyet[dinh_hien_tai] = True
            thu_tu_duyet.append(dinh_hien_tai)
            
            for dinh_ke in range(len(do_thi), 0, -1):
                if do_thi[dinh_hien_tai-1][dinh_ke-1] == 1 and not da_duyet[dinh_ke]:
                    ngan_xep.append(dinh_ke)
                    
    return thu_tu_duyet