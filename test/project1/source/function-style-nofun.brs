sub test1()
    print "ok"
    exec(sub()
        print "ok"
    end sub)
end sub

sub test2()
    print "ko"
    exec(sub()
        print "ko"
    end sub)
    return "ko"
end sub

sub test3()
    print "okko"
end sub

sub exec(x)
    return
    print "unreachable"
end sub
