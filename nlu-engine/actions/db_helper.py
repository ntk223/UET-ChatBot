import os
import sqlite3
import psycopg2

def get_db_connection():
    # Try PostgreSQL first
    try:
        host = os.getenv("DB_HOST", "localhost")
        port = int(os.getenv("DB_PORT", "5432"))
        user = os.getenv("DB_USER", "root")
        password = os.getenv("DB_PASS", "root")
        database = os.getenv("DB_NAME", "uet_chatbot")
        
        conn = psycopg2.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            database=database,
            connect_timeout=2
        )
        return conn, "postgres"
    except Exception as e:
        # Fall back to SQLite database file
        db_path = os.getenv("SQLITE_DB_PATH", "uet_admissions.db")
        conn = sqlite3.connect(db_path)
        return conn, "sqlite"

def get_db_cursor(conn, conn_type):
    if conn_type == "postgres":
        from psycopg2.extras import RealDictCursor
        return conn.cursor(cursor_factory=RealDictCursor)
    else:
        conn.row_factory = sqlite3.Row
        return conn.cursor()

def init_db():
    try:
        conn, conn_type = get_db_connection()
        cursor = conn.cursor()
        # 0. User table for login
        if conn_type == "postgres":
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(100) NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)
        else:
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL,
                password TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
            """)

        # 1. Majors reference table
        if conn_type == "postgres":
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS majors (
                major_code VARCHAR(10) PRIMARY KEY,
                major_name VARCHAR(100) NOT NULL,
                tuition_fee DECIMAL(12,2),
                benchmark_2025 DECIMAL(4,2),
                quota INT,
                description TEXT
            )
            """)
        else:
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS majors (
                major_code TEXT PRIMARY KEY,
                major_name TEXT NOT NULL,
                tuition_fee REAL,
                benchmark_2025 REAL,
                quota INTEGER,
                description TEXT
            )
            """)
            
        # 2. Main candidates table
        if conn_type == "postgres":
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS candidates (
                id SERIAL PRIMARY KEY,
                user_id INT,
                fullname VARCHAR(100) NOT NULL,
                phone_number VARCHAR(15) NOT NULL,
                chosen_major_code VARCHAR(10),
                admission_method VARCHAR(20) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (chosen_major_code) REFERENCES majors(major_code)
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
            """)
        else:
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS candidates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                fullname TEXT NOT NULL,
                phone_number TEXT NOT NULL,
                chosen_major_code TEXT,
                admission_method TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (chosen_major_code) REFERENCES majors(major_code)
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
            """)
            
        # 3. Sub-method tables
        if conn_type == "postgres":
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS admission_thptqg (
                candidate_id INT PRIMARY KEY,
                block_name VARCHAR(5) NOT NULL,
                total_score DECIMAL(4,2) NOT NULL,
                evidence_url VARCHAR(255) NOT NULL,
                FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
            )
            """)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS admission_hsa (
                candidate_id INT PRIMARY KEY,
                hsa_id VARCHAR(20) NOT NULL,
                hsa_score INT NOT NULL,
                evidence_url TEXT NOT NULL,
                FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
            )
            """)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS admission_ielts (
                candidate_id INT PRIMARY KEY,
                ielts_score DECIMAL(3,1) NOT NULL,
                evidence_url TEXT NOT NULL,
                FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
            )
            """)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS admission_direct (
                candidate_id INT PRIMARY KEY,
                award_name VARCHAR(255) NOT NULL,
                evidence_url TEXT NOT NULL,
                FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
            )
            """)
        else:
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS admission_thptqg (
                candidate_id INTEGER PRIMARY KEY,
                block_name TEXT NOT NULL,
                total_score REAL NOT NULL,
                evidence_url TEXT NOT NULL,
                FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
            )
            """)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS admission_hsa (
                candidate_id INTEGER PRIMARY KEY,
                hsa_id TEXT NOT NULL,
                hsa_score INTEGER NOT NULL,
                evidence_url TEXT NOT NULL,
                FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
            )
            """)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS admission_ielts (
                candidate_id INTEGER PRIMARY KEY,
                ielts_score REAL NOT NULL,  
                math_score REAL NOT NULL,
                evidence_url TEXT NOT NULL,
                FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
            )
            """)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS admission_direct (
                candidate_id INTEGER PRIMARY KEY,
                award_name TEXT NOT NULL,
                evidence_url TEXT NOT NULL,
                FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
            )
            """)
            
        cursor.execute("SELECT COUNT(*) FROM majors")
        count = cursor.fetchone()[0]
        if count == 0:
            majors_initial = [
                ("CN1", "Công nghệ thông tin", 44.0, 28.19, 460, "Ngành học mũi nhọn đào tạo chuyên sâu về phát triển phần mềm, mạng máy tính, an toàn thông tin và hệ thống thông tin."),
                ("CN2", "Kỹ thuật máy tính", 40.0, 27.00, 400, "Kỹ thuật máy tính tập trung nghiên cứu thiết kế vi mạch, hệ thống nhúng thông minh và tích hợp phần cứng - phần mềm."),
                ("CN3", "Vật lý kỹ thuật", 35.0, 25.00, 160, "Vật lý kỹ thuật kết hợp giữa khoa học nền tảng và ứng dụng thực tiễn trong công nghệ quang tử và vật liệu mới."),
                ("CN4", "Cơ kỹ thuật", 35.0, 25.00, 60, "Cơ kỹ thuật đào tạo chuyên sâu về cơ học vật lý, kỹ thuật cơ khí chính xác và mô phỏng số."),
                ("CN5", "Công nghệ kỹ thuật xây dựng", 35.0, 22.25, 160, "Công nghệ kỹ thuật xây dựng đào tạo kiến thức thiết kế công trình, quản lý dự án và hạ tầng giao thông thông minh."),
                ("CN6", "Công nghệ kỹ thuật cơ - điện tử", 38.0, 25.00, 160, "Cơ điện tử tích hợp cơ học chính xác, điện tử viễn thông và điều khiển thông minh để thiết kế hệ thống sản xuất tự động."),
                ("CN7", "Công nghệ hàng không vũ trụ", 40.0, 25.00, 120, "Công nghệ hàng không vũ trụ tập trung phát triển kỹ thuật hàng không, công nghệ vệ tinh và thiết bị bay không người lái."),
                ("CN8", "Khoa học máy tính", 44.0, 27.86, 400, "Khoa học máy tính chuyên sâu về nghiên cứu giải thuật, trí tuệ nhân tạo, khoa học dữ liệu và học máy nâng cao."),
                ("CN9", "Công nghệ kỹ thuật điện tử - viễn thông", 40.0, 25.00, 480, "Điện tử viễn thông nghiên cứu kỹ thuật truyền thông, IoT, viễn thông di động 5G/6G và xử lý tín hiệu."),
                ("CN10", "Công nghệ nông nghiệp", 35.0, 22.00, 60, "Công nghệ nông nghiệp ứng dụng IoT, AI, cảm biến thông minh vào quản lý cây trồng và sản xuất nông nghiệp thông minh."),
                ("CN11", "Kỹ thuật điều khiển và tự động hóa", 40.0, 27.90, 140, "Kỹ thuật điều khiển và tự động hóa nghiên cứu hệ thống điều khiển tự động, dây chuyền sản xuất và thiết bị robot."),
                ("CN12", "Trí tuệ nhân tạo", 44.0, 27.75, 320, "Trí tuệ nhân tạo chuyên sâu về các mô hình học sâu, xử lý ngôn ngữ tự nhiên, thị giác máy tính và ứng dụng AI thực tế."),
                ("CN13", "Kỹ thuật năng lượng", 35.0, 25.00, 60, "Kỹ thuật năng lượng đào tạo về hệ thống điện, năng lượng tái tạo (mặt trời, gió) và hiệu quả sử dụng năng lượng."),
                ("CN14", "Hệ thống thông tin", 44.0, 26.38, 240, "Hệ thống thông tin nghiên cứu quản lý, phân tích dữ liệu lớn và giải pháp CNTT hỗ trợ vận hành doanh nghiệp."),
                ("CN15", "Mạng máy tính và truyền thông dữ liệu", 40.0, 25.00, 120, "Mạng máy tính và truyền thông dữ liệu chuyên sâu về thiết kế hạ tầng mạng, điện toán đám mây và an ninh mạng."),
                ("CN17", "Kỹ thuật Robot", 40.0, 25.00, 140, "Kỹ thuật Robot tập trung thiết kế, lắp ráp và lập trình cho các robot công nghiệp và robot hỗ trợ dịch vụ."),
                ("CN18", "Thiết kế công nghiệp và Đồ họa", 38.0, 25.00, 240, "Thiết kế công nghiệp và Đồ họa đào tạo tích hợp mỹ thuật và công nghệ, thiết kế giao diện ứng dụng UI/UX và thiết kế công nghiệp."),
                ("CN19", "Công nghệ vật liệu", 38.0, 25.00, 120, "Công nghệ vật liệu chuyên sâu về thiết kế và chế tạo linh kiện bán dẫn, vi mạch điện tử và vật liệu nano tiên tiến."),
                ("CN20", "Khoa học dữ liệu", 44.0, 27.38, 120, "Khoa học dữ liệu tập trung xây dựng mô hình thu thập, xử lý và phân tích dữ liệu lớn phục vụ ra quyết định chiến lược."),
                ("CN21", "Công nghệ sinh học", 35.0, 25.00, 60, "Công nghệ sinh học ứng dụng công nghệ gene, sinh học nano và kỹ thuật sinh học trong y học và nông nghiệp.")
            ]
            placeholder = "%s" if conn_type == "postgres" else "?"
            for m in majors_initial:
                cursor.execute(f"INSERT INTO majors VALUES ({placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder}, {placeholder})", m)
                
        conn.commit()
        conn.close()
        print(f"Database initialized successfully with connection type: {conn_type}")
    except Exception as e:
        print(f"Failed to initialize database: {e}")

# Helper to find major code from free-text major name
def find_major_code(chosen_major: str) -> str:
    if not chosen_major:
        return "CN1"
    norm = chosen_major.strip().upper()
    valid_codes = ["CN1", "CN2", "CN3", "CN4", "CN5", "CN6", "CN7", "CN8", "CN9", "CN10", "CN11", "CN12", "CN13", "CN14", "CN15", "CN17", "CN18", "CN19", "CN20", "CN21"]
    
    if norm in valid_codes:
        return norm
        
    try:
        conn, conn_type = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT major_code, major_name FROM majors")
        rows = cursor.fetchall()
        cursor.close()
        conn.close()
        
        chosen_lower = chosen_major.lower()
        for row in rows:
            code, name = row[0], row[1]
            if code.lower() in chosen_lower or name.lower() in chosen_lower or chosen_lower in name.lower():
                return code
    except Exception as e:
        print(f"Error in find_major_code: {e}")
        
    return "CN1"
