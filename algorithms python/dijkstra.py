import heapq

def thuat_toan_dijkstra(do_thi, dinh_bat_dau):
    khoang_cach = {v: float('inf') for v in do_thi}
    khoang_cach[dinh_bat_dau] = 0
    truoc = {v: None for v in do_thi} 
    
    hang_doi = [(0, dinh_bat_dau)]
    
    while hang_doi:
        kc_hien_tai, u = heapq.heappop(hang_doi)
        
        if kc_hien_tai > khoang_cach[u]: 
            continue
            
        for v, trong_so in do_thi[u].items():
            kc_moi = khoang_cach[u] + trong_so
            
            if kc_moi < khoang_cach[v]:
                khoang_cach[v] = kc_moi
                truoc[v] = u 
                heapq.heappush(hang_doi, (kc_moi, v))
                
    return khoang_cach, truoc