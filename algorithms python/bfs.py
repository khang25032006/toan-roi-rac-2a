def bfs(do_thi, dinh_bat_dau):
    da_duyet = [False] * (len(do_thi) + 1)
    hang_doi = [dinh_bat_dau]
    da_duyet[dinh_bat_dau] = True
    thu_tu_duyet = []
    
    while hang_doi:
        dinh_hien_tai = hang_doi.pop(0)
        thu_tu_duyet.append(dinh_hien_tai)
        
        for dinh_ke in range(1, len(do_thi) + 1):
            # Kiểm tra xem có cạnh nối và đỉnh kề đó chưa được duyệt
            if do_thi[dinh_hien_tai - 1][dinh_ke - 1] == 1 and not da_duyet[dinh_ke]:
                hang_doi.append(dinh_ke)
                da_duyet[dinh_ke] = True
                
    return thu_tu_duyet